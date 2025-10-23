import { Dialog } from "@base-ui-components/react/dialog";
import type { ReactNode } from "react";
import XIcon from "./x-icon";

export default function Drawer({
  open,
  setOpen,
  title,
  children,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-black/6 opacity-95 fixed inset-0" />
        <Dialog.Popup className="max-w-96 w-2/5 fixed right-2 bottom-2 top-2 rounded-sm bg-neutral-900 text-gray-100 overflow-y-auto data-open:animate-slide-right data-closed:animate-slide-out-right flex flex-col border shadow-sm border-neutral-700">
          <header className="flex justify-between gap-4 items-center p-4">
            <Dialog.Title className="text-base font-semibold text-gray-100">
              {title}
            </Dialog.Title>
            <Dialog.Close className="text-gray-300 p-0.5! border-0! hover:bg-neutral-800! hover:rounded-sm! outline-0">
              <XIcon className="size-4" />
            </Dialog.Close>
          </header>
          <div className="relative flex-1 text-gray-100 overflow-auto p-5">
            {children}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
