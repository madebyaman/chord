import { Dialog } from "@base-ui-components/react/dialog";
import type { ReactNode } from "react";
import XIcon from "./x-icon";

interface DrawerRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface DrawerHeaderProps {
  children: ReactNode;
}

interface DrawerTitleProps {
  children: ReactNode;
}

interface DrawerContentProps {
  children: ReactNode;
}

function DrawerRoot({ open, onOpenChange, children }: DrawerRootProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-black/6 opacity-95 fixed inset-0" />
        <Dialog.Popup className="max-w-96 w-2/5 fixed right-2 bottom-2 top-2 rounded-sm data-open:animate-slide-right data-closed:animate-slide-out-right flex flex-col border shadow-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-700">
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DrawerHeader({ children }: DrawerHeaderProps) {
  return (
    <header className="flex justify-between gap-4 items-center px-4 pt-4 dark:border-neutral-700">
      {children}
    </header>
  );
}

function DrawerTitle({ children }: DrawerTitleProps) {
  return (
    <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </Dialog.Title>
  );
}

function DrawerClose() {
  return (
    <Dialog.Close className="p-0.5! bg-inherit! border-0! hover:rounded-sm! outline-0 text-gray-600 dark:text-gray-300! hover:bg-gray-100 dark:hover:bg-neutral-800!">
      <XIcon className="size-5!" />
    </Dialog.Close>
  );
}

function DrawerContent({ children }: DrawerContentProps) {
  return (
    <div className="relative flex-1 overflow-auto p-5 text-gray-900 dark:text-gray-100">
      {children}
    </div>
  );
}

const Drawer = {
  Root: DrawerRoot,
  Header: DrawerHeader,
  Title: DrawerTitle,
  Close: DrawerClose,
  Content: DrawerContent,
};

export default Drawer;
