import Link from "next/link";
import { Component, ReactNode } from "react";

import styles from "styles/Home.module.css";
import { trpcClient } from "utils/trpc";
//@ts-ignore
import { ManagerIdentifier } from "@coderatparadise/showrunner-time";

export class ManagerSelectorComponent extends Component {
  constructor(props: {}) {
    super(props);
  }

  componentDidMount(): void {
    const self = this;
    // @ts-ignore
    trpcClient.listManagers.subscribe(undefined, {
      onData(managers) {
        self.setState({ managers: managers });
      },
      onError(err) {
        console.log(err);
      },
    });
  }

  render(): ReactNode {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          {this.state.managers?.length === 0 ? (
            <div>No loaded managers</div>
          ) : (
            this.state.managers?.map((v) => (
              <Link
                href={`/channel/${new ManagerIdentifier(v.id).session()}`}
                key={v.id}
              >
                {v.name}
              </Link>
            ))
          )}
        </main>
      </div>
    );
  }

  state: {
    managers: { id: string; name: string }[];
  } = {
    managers: [],
  };
}
