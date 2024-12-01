import { Collection, Db, MongoClient, OptionalId } from 'mongodb';
import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
import { Boom } from '@hapi/boom';
import readline from 'readline'

import P from 'pino'
const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./wa-logs.txt'))

// Read line interface
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve))


const { 
    DisconnectReason,
    makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    IMessageKey,
} = require("@whiskeysockets/baileys");
import { useMongoDBAuthState } from './mongoAuthState';

import { ObjectId } from 'mongodb';

// const { state, saveState } = useSingleFileAuthState('./credentials/auth_info.json');
// const { state, saveCreds } = await useMultiFileAuthState('./qark/credentials')
const opensearchClient = new OpenSearchClient({
    node: 'http://localhost:9200',
    auth: {
        username: 'admin',
        password: 'admin'
    }
});

console.log("Starting whatsapp server")


const CHUNK_SIZE_LIMIT = 50; // Maximum messages per chunk
const TIME_THRESHOLD = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds



const mongoClient = new MongoClient('mongodb://localhost:27017');
let userDB: Collection<any>;
const store = makeInMemoryStore({})
// store.readFromFile('./baileys_store_multi.json')
// save every 10s
// setInterval(() => {
// 	store.writeToFile('./baileys_store_multi.json')
// }, 10_000)

let processingCount = 0;
let skippedProcessing = 0;


// Update interfaces to be simple type definitions
interface WhatsAppMessage {
    _id: string;
    chat_id: string;
    chunk_id: ObjectId;
    timestamp: Date;
    content: string;
}

interface WhatsAppChunk {
    _id?: ObjectId;  // Optional for new documents
    chat_id: string;
    created_at: number;
    last_message_timestamp: number;
    message_count: number;
    message_ids: string[];
    embedding: null;
}

let db: Db;
let chunksCollection: Collection<WhatsAppChunk>;
let messagesCollection: Collection<WhatsAppMessage>;

async function main() {
    await mongoClient.connect();
    
    // Initialize db first
    db = mongoClient.db('whatsapp');
    
    // Create collections before starting WhatsApp connection
    await createCollectionsIfNotExist();
    
    // Initialize collection references
    chunksCollection = db.collection('chunks');
    messagesCollection = db.collection('messages');
    userDB = db.collection('users');
    
    // Start WhatsApp connection only after DB is ready
    await connectWhatsApp('saurabh', 'saurabh');
}

// Call the main function
main().catch(console.error);



// User Authentication Function
async function authenticateUser(username: string, password: string): Promise<{ state: any; saveCreds: () => Promise<void>; removeCreds: () => Promise<void> }> {
    // const { state, saveCreds, removeCreds } = await useMongoDBAuthState(userDB);
    const { state, saveCreds, removeCreds } = await useMultiFileAuthState('./whatsapp/credentials')
    return { state, saveCreds, removeCreds };
}

// Initialize Baileys and Connect to OpenSearch
async function connectWhatsApp(username: string, password: string): Promise<void> {
    let state, saveCreds, removeCreds;
    try {
        ({ state, saveCreds, removeCreds } = await authenticateUser(username, password));
    } catch (error) {
        console.log('Authentication failed : ', error);
        return;
    }

	// fetch latest version of WA Web
	const { version, isLatest } = await fetchLatestBaileysVersion()
	console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

	const sock = makeWASocket({
		version,
		logger,
		printQRInTerminal: false,
		mobile: false,
		auth: {
			creds: state.creds,
			/** caching makes the store faster to send/recv messages */
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
        // msgRetryCounterCache,
		generateHighQualityLinkPreview: true,
		// ignore all broadcast messages -- to receive the same
		// comment the line below out
		// shouldIgnoreJid: jid => isJidBroadcast(jid),
		// implement to handle retries & poll updates
        syncFullHistory: true,
        shouldSyncHistoryMessage: () => true,
        getMessage: async (key: typeof IMessageKey,) => {
            if (!key.id) return undefined;
            const message = await messagesCollection.findOne({ 'key.id': key.id });
            if (!message) return undefined;
            return {
                conversation: message.content,
                messageTimestamp: message.timestamp
            };
        }
    })

    store?.bind(sock.ev)
    console.log('Sock Events:', sock.ev);

    // Pairing code for Web clients
	if(sock && !sock.authState.creds.registered) {
		// const phoneNumber: string = await question('Please enter your mobile phone number:\n')
        // console.log(`phone number: ${phoneNumber}`)
        // add sleep of 5 seconds
        await new Promise(resolve => setTimeout(resolve, 30000));
		const code = await sock.requestPairingCode('14256289010')
		console.log(`Pairing code: ${code}`)
	}

    console.log('Sock Events:', sock.ev);


    sock.ev.process(
		// events is a map for event name => event data
		async(events: any) => {
 			// credentials updated -- save them
			if(events['creds.update']) {
				await saveCreds()
			}

            if(events['connection.update']) {
				const update = events['connection.update']
				const { connection, lastDisconnect } = update
				if(connection === 'close') {
					// Get the status code from the error
					const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                    console.log('statusCode', statusCode);
					
					if(statusCode !== DisconnectReason.loggedOut) {
                        // console.log('Reconnecting...');
						// connectWhatsApp(username, password);
						// Add delay before reconnecting to prevent immediate retry loops
						setTimeout(() => {
							console.log('Reconnecting...');
							connectWhatsApp(username, password);
						}, 3000);
					} else {
						console.log('Connection closed. You are logged out.')
                        // remove credentials
                        await removeCreds()
                        connectWhatsApp(username, password);
					}
				}

				console.log('connection update', update)
			}

            console.log('events', events);

            if(events['messages.upsert']) {
                const upsert = events['messages.upsert']
                console.log('recv messages ', JSON.stringify(upsert, undefined, 2))
                for (const msg of upsert.messages) {
                    if (msg.message?.conversation) {
                        const content = msg.message.conversation;
                        const timestamp = new Date();
                        
                        await processMessage(msg.key.remoteJid, msg.key.id, content, timestamp);
                    }
                }
            }

            /**  */
            // receive all old messages and process them as well.
            // if(events['messages.history']) {
            //     console.log('Begin processing history messages');
            //     const history = events['messages.history']
            //     console.log('recv history ', JSON.stringify(history, undefined, 2))
            //     // use multiple threads to process messages in parallel
            //     const promises: Promise<void>[] = [];
            //     for (const msg of history.messages) {
            //         promises.push(processMessage(msg.key.remoteJid, msg.key.id, msg.message?.conversation, new Date(msg.message?.timestamp * 1000)));
            //     }
            //     await Promise.all(promises);

            //     console.log('processed history messages: ', processingCount, 'skipped: ', skippedProcessing);
            // }

           // Receive all old messages and process them as well
            if (events['messages.history']) {
                console.log('Processing history messages...');
                const history = events['messages.history'];
                console.log('History Messages: ', JSON.stringify(history, null, 2));

                const promises: Promise<void>[] = [];
                for (const msg of history.messages) {
                    promises.push(processMessage(
                        msg.key.remoteJid, 
                        msg.key.id, 
                        msg.message?.conversation, 
                        new Date(msg.message?.timestamp * 1000)
                    ));
                }
                await Promise.all(promises);
                console.log('Finished processing history messages.');
            }

            // Handle on-demand sync
            if (events['messaging-history.set']) {
                console.log('Processing on-demand history sync...');
                const { chats, contacts, messages, isLatest, progress, syncType } = events['messaging-history.set'];

                // if (syncType === proto.HistorySync.HistorySyncType.ON_DEMAND) {
                // console.log('On-Demand Sync Messages: ', JSON.stringify(messages, null, 2));

                for (const msg of messages) {
                    await processMessage(
                        msg.key.remoteJid, 
                        msg.key.id,
                        msg.message?.conversation,
                        new Date(Number(msg.messageTimestamp) * 1000)
                    );
                }
                // }
                console.log(`Processed ${messages.length} messages from on-demand sync.`);
            }

            // Handle full history sync
            if (events['history.sync']) {
                console.log('Processing full history sync...');
                const history = events['history.sync'];
                console.log('Full History Sync: ', JSON.stringify(history, null, 2));

                const promises: Promise<void>[] = [];
                for (const msg of history.messages) {
                    promises.push(processMessage(
                        msg.key.remoteJid, 
                        msg.key.id, 
                        msg.message?.conversation, 
                        new Date(msg.message?.timestamp * 1000)
                    ));
                }
                await Promise.all(promises);
                console.log('Processed full history sync messages.');
            }
        }
    )
}

async function processMessage(chatId: string, messageId: string, content: string, timestamp: Date): Promise<void> {
    // Ensure collections are initialized
    if (!messagesCollection || !chunksCollection) {
        console.error('Database collections not initialized');
        return;
    }

    // console.log('processing message: ', chatId, messageId, content, timestamp);
    
    // don't process if message is empty
    if (!content) {
        return;
    }
    // don't process if message already exists
    const existingMessage = await messagesCollection.findOne({ _id: messageId });
    if (existingMessage) {
        // atomic increment skipped processing count in memory for console logging
        skippedProcessing++;
        return;
    }

    // maintain processing count in server everytime account is connected in memory 
    processingCount++;
    if (processingCount % 100 === 0) {
        console.log('processed messages: ', processingCount, 'skipped: ', skippedProcessing);
    }

    // get or create a chunk for the message
    const chunk = await getOrCreateChunk(chatId, messageId, content, timestamp);
    // console.log('chunk', chunk);

    // index the message in OpenSearch
    await opensearchClient.index({
        index: 'whatsapp_messages',
        body: {
            chat_id: chatId,
            message_id: messageId,
            chunk_id: chunk._id,
            timestamp: timestamp,
            content: content
        }
    });
}


async function createCollectionsIfNotExist() {
  // Await the list of collections
  const collections = await db?.listCollections().toArray();
  if (!collections) {
    throw new Error('Database not initialized');
  }
  const collectionNames = collections.map(c => c.name);

  // Check if 'chunks' collection exists, if not, create it
  if (!collectionNames.includes('chunks')) {
    if (!db) {
      throw new Error('Database not initialized');
    }
    await db.createCollection('chunks');
    console.log('Collection "chunks" created.');
  }

  // Check if 'messages' collection exists, if not, create it
  if (!collectionNames.includes('messages')) {
    if (!db) {
      throw new Error('Database not initialized');
    }
    await db.createCollection('messages');
    console.log('Collection "messages" created.');
  }

  if (!collectionNames.includes('users')) {
    if (!db) {
      throw new Error('Database not initialized');
    }
    await db.createCollection('users');
    console.log('Collection "users" created.');
  }
}



// Function to get or create a chunk based on chat ID, message content, and timestamp
async function getOrCreateChunk(chatId: string, messageId: string, content: string, timestamp: Date): Promise<any> {
    const currentTime = timestamp.getTime();
    // 1. Try to find an existing chunk for the chat that can still accept more messages
    let chunk = await chunksCollection.findOne({
        chat_id: chatId,
        message_count: { $lt: CHUNK_SIZE_LIMIT },
        last_message_timestamp: { $gte: currentTime - TIME_THRESHOLD }
    });

    // 2. If a suitable chunk exists, update it with the new message information
    if (chunk && messagesCollection) {
        // Add the message to the `messages` collection
        await messagesCollection.insertOne({
            _id: messageId,
            chat_id: chatId,
            chunk_id: chunk._id,
            timestamp: timestamp,
            content: content
        } as WhatsAppMessage);
        // Update the chunk to include this new message
        await chunksCollection.updateOne(
            { _id: chunk._id },
            {
                $push: { message_ids: messageId },
                $set: { last_message_timestamp: currentTime },
                $inc: { message_count: 1 }
            }
        );

        return chunk;
    }

    // 3. If no suitable chunk exists, create a new chunk
    const newChunk: WhatsAppChunk = {
        chat_id: chatId,
        created_at: currentTime,
        last_message_timestamp: currentTime,
        message_count: 1,
        message_ids: [],
        embedding: null
    };
    // Insert the new chunk into the `chunks` collection
    const result = await chunksCollection.insertOne(newChunk);
    const insertedId = result?.insertedId;

    // Add the message to the `messages` collection and link it to the new chunk
    await messagesCollection.insertOne({
        _id: messageId,
        chat_id: chatId,
        chunk_id: insertedId,
        timestamp,
        content
    } as WhatsAppMessage);

    // Update the chunk with the initial message's ID
    await chunksCollection.updateOne(
        { _id: insertedId },
        { $push: { message_ids: messageId } }
    );

    return { ...newChunk, _id: insertedId };
}


async function getMessage(key: { id: string, remoteJid: string }): Promise<any> {
    try {
        // Try to get message from your database first
        const msg = await messagesCollection.findOne({ 
            _id: key.id,
            'key.remoteJid': key.remoteJid 
        });
        if (!msg) return undefined;
        return msg
    } catch (error) {
        console.error('Error fetching message:', error);
        return undefined;
    }
}