import TopBar from "./TopBar";

export default function AppShell({
  children,
  header = "app", // "none" | "app" | "auth" | "profile"
  headerProps = {},
  maxWidth = "max-w-lg",
  padded = true,
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {header !== "none" ? <TopBar variant={header} {...headerProps} /> : null}

      <main
        className={[
          "mx-auto w-full",
          maxWidth,
          padded ? "px-4 py-8 md:py-12" : "",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}