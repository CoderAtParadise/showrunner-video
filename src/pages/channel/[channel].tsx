import { NextPage } from "next";
import { useRouter } from "next/router.js";
import { ClientManagerComponent } from "components/ClientManagerComponent";

const Channel: NextPage = () => {
  const router = useRouter();
  const { channel } = router.query;
  return channel !== undefined ? (
    <ClientManagerComponent id={channel as string} />
  ) : (
    <div />
  );
};

export default Channel;
