(async () => {
  const src = "main.js";
  const contentScript = await import(src);
  contentScript.main();
})();