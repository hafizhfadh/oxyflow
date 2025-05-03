export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen gap-12 items-center">{children}</div>
  );
}
