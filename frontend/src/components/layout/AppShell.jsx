import TopBar from "./TopBar";

export default function AppShell({
  children,
  header = "app",
  headerProps = {},
  maxWidth = "max-w-lg",
  padded = true,
  className = "",
}) {
  return (
    <div className={["min-h-screen bg-background text-foreground", className].join(" ")}>
      {header !== "none" ? <TopBar variant={header} {...headerProps} /> : null}

      <main
        className={[
          "mx-auto w-full",
          maxWidth,
          "px-4",
          padded ? "py-6 md:py-8" : "",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}