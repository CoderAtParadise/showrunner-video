import "../styles/globals.css";
import { AppProps } from "next/app.js";
import Head from "next/head.js";

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

export default MyApp;