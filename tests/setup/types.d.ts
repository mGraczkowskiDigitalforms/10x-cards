declare module "*.astro" {
  const Component: {
    default: {
      render: (this: unknown) => Promise<string>;
    };
  };
  export default Component;
}

// Extend Astro global namespace
declare namespace Astro {
  interface Request {
    headers: Headers;
  }
}
