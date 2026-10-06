export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">{children}</main>;
}
