import { Logging } from '@google-cloud/logging';

const logging = new Logging();
const log = logging.log('qark-nextjs-log');

export const logInfo = async (message: string) => {
    const metadata = { resource: { type: 'global' } };
    const entry = log.entry(metadata, message);
    await log.write(entry);
};

export const logDebug = async (message: string) => {
    const metadata = { resource: { type: 'global' } };
    const entry = log.entry(metadata, message);
    await log.write(entry);
};

export const logError = async (message: string) => {
    const metadata = { resource: { type: 'global' } };
    const entry = log.entry(metadata, message);
    await log.write(entry);
};