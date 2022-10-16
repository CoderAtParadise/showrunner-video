import "../styles/globals.css";
import { withTRPC } from "@trpc/next";
import { AppProps } from "next/app.js";
import { AppRouter } from "../server/routers/app.js";
import Head from "next/head.js";
import { getEndingLink } from "utils/trpc";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Showrunner Video Control</title>
        <meta name="description" content="Showrunner video control page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} styles={{"padding-top":"-20px"}}/>
    </>
  );
}

export default withTRPC<AppRouter>({
  config() {
    return {
      links: [getEndingLink()],
    };
  },
})(MyApp);
