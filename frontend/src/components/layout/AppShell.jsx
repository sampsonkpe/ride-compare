import TopBar from "./TopBar";

export default function AppShell({
  children,
  topbar = true,
  topbarProps = {},
  width = "md",
  padded = true,
  center = false,
}) {
  const maxWidth =
    width === "full" ? "max-w-none" : width === "lg" ? "max-w-5xl" : "max-w-4xl";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {topbar ? <TopBar {...topbarProps} /> : null}

      <main
        className={[
          maxWidth,
          "mx-auto w-full",
          padded ? "px-4 sm:px-6 py-6" : "",
          center ? "min-h-[calc(100vh-56px)] flex items-center justify-center" : "",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}