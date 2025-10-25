import { Dialog } from "@base-ui-components/react/dialog";
import type { ReactNode } from "react";
import XIcon from "./x-icon";

interface DrawerRootProps extends Dialog.Popup.Props {
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

function DrawerRoot({ open, onOpenChange, children, ...props }: DrawerRootProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="drawer-backdrop" />
        <Dialog.Popup className="drawer-popup" {...props}>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DrawerHeader({ children }: DrawerHeaderProps) {
  return (
    <header className="drawer-header">
      {children}
    </header>
  );
}

function DrawerTitle({ children }: DrawerTitleProps) {
  return (
    <Dialog.Title className="drawer-title">
      {children}
    </Dialog.Title>
  );
}

function DrawerClose() {
  return (
    <Dialog.Close className="drawer-close" aria-label="Close">
      <XIcon className="drawer-close-icon" />
    </Dialog.Close>
  );
}

function DrawerContent({ children }: DrawerContentProps) {
  return (
    <div className="drawer-content">
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
