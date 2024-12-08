import * as Dialog from '@radix-ui/react-dialog';

import React from 'react';
import { Button } from '../ui/button';

export default function ConfirmationModal({
  title = "Confirm Action",
  message = "Are you sure you want to perform this action? This cannot be undone.",
  yesBtnText = "Yes",
  noBtnText = "No",
  needNoBtn = true,
  isAcceptedCallback,
  isOpen,
  buttonType = 'primary',
  onClose
}: {
  title?: string;
  message?: string;
  yesBtnText?: string;
  noBtnText?: string;
  needNoBtn?: boolean;
  isAcceptedCallback: (isAccepted: boolean) => void;
  isOpen: boolean; // Control if the modal is open or closed
  buttonType?: 'primary' | 'danger';
  onClose: () => void;
}) {
  const handleOnClick = (isAccepted: boolean) => {
    isAcceptedCallback(isAccepted);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose} modal={true}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-10" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow z-10 w-full lg:w-1/3"
          onInteractOutside={(e) => {
            // Prevent the dialog from closing when clicking outside
            e.preventDefault();
          }}
        >
          <div className="flex flex-col">
            <Dialog.Title className="text-lg font-semibold text-muted m-0">{title}</Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600">
              {message}
            </Dialog.Description>
            <div className="flex justify-end gap-4 mt-10">
              
              {
                <Button
                  className={`px-4 py-2 ${(buttonType === 'danger') ? "bg-red-500" : "bg-blue-500"} text-white rounded-lg`}
                  onClick={() => handleOnClick(true)}
                >
                  {yesBtnText}
                </Button>
              }

              { needNoBtn && (
                  <Button
                    className="px-4 py-2 bg-gray-300 text-black rounded-lg"
                    onClick={() => handleOnClick(false)}
                  >
                    {noBtnText}
                  </Button>
                )
              }
              

            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
