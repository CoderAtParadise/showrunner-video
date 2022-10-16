import type { NextPage } from "next";
import Link from "next/link.js";
import { useState } from "react";
import { trpc } from "utils/trpc";

import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const [managers, setManagers] = useState<{ id: string; name: string }[]>();
  (trpc.listManagers as any).useSubscription(undefined, {
    onData(managers) {
      setManagers(managers);
    },
    onError(err) {
      console.log(err);
    },
  });
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {managers?.length === 0 ? (
          <div>No loaded managers</div>
        ) : (
          managers?.map((v) => (
            <Link href={`/channel/${v.id}`} key={v.id}>
              {v.name}
            </Link>
          ))
        )}
      </main>
    </div>
  );
};

export default Home;
