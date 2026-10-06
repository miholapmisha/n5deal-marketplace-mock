// Signed-in screens. No auth check here: layouts do not re-run on client navigation, so
// every page calls requireRole() itself.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>;
}
