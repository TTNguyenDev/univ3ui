import { Contract, ethers } from "ethers";
import { useContext, useReducer, useEffect, useState } from "react";
import { MetaMaskContext } from "../contexts/MetaMask";

const PoolABI = require("../abi/Pool.json");

const getEvents = (pool: any) => {
  return Promise.all([
    pool.queryFilter("Mint", "earliest", "latest"),
    pool.queryFilter("Swap", "earliest", "latest"),
  ]).then(([mints, swaps]) => {
    return Promise.resolve((mints || []).concat(swaps || []));
  });
};

const subscribeToEvents = (pool: any, callback: any) => {
  pool.once(
    "Mint",
    (
      _a: string,
      _b: string,
      _c: string,
      _d: string,
      _e: string,
      _f: string,
      _g: string,
      event: any,
    ) => callback(event),
  );
  pool.once(
    "Swap",
    (
      _a: string,
      _b: string,
      _c: string,
      _d: string,
      _e: string,
      _f: string,
      _g: string,
      event: any,
    ) => callback(event),
  );
};

const renderAmount = (amount: any) => {
  return ethers.formatUnits(amount);
};

const renderSwap = (args: any) => {
  return (
    <span>
      <strong>Swap</strong>
      [amount0: {renderAmount(args.amount0)}, amount1:
      {renderAmount(args.amount1)}]
    </span>
  );
};

const renderMint = (args: any) => {
  return (
    <span>
      <strong>Mint</strong>
      [range: [{args.tickLower}-{args.tickUpper}], amounts: [
      {renderAmount(args.amount0)}, {renderAmount(args.ammount1)}]]
    </span>
  );
};

const renderEvent = (event: any, i: any) => {
  let content;
  switch (event.event) {
    case "Mint":
      content = renderMint(event.args);
      break;
    case "Swap":
      content = renderSwap(event.args);
      break;
  }
  return <li key={i}>{content}</li>;
};

const isMintOrSwap = (event: any) => {
  return event.event === "Mint" || event.event === "Swap";
};

const cleanEvents = (events: any) => {
  return events
    .sort((a: any, b: any) => b.blockNumber - a.blockNumber)
    .filter((el: any, i: any, arr: any) => {
      return (
        i === 0 ||
        el.blockNumber !== arr[i - 1].blockNumber ||
        el.logIndex !== arr[i - 1].logIndex
      );
    });
};

const eventsReducer = (state: any, action: any) => {
  switch (action.type) {
    case "add":
      return cleanEvents([action.value, ...state]);

    case "set":
      return cleanEvents(action.value);
  }
};

const EventsFeed = (props: any) => {
  const config = props.config;
  const metamaskContext = useContext(MetaMaskContext);
  const [events, setEvents] = useReducer(eventsReducer, []);
  const [pool, setPool] = useState<Contract>();

  useEffect(() => {
    if (metamaskContext.status !== "connected") {
      return;
    }

    if (!pool) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const newPool = new Contract(config.poolAddress, PoolABI, provider);

      subscribeToEvents(newPool, (event: any) =>
        setEvents({ type: "add", value: event }),
      );

      getEvents(newPool).then((events: any) => {
        setEvents({ type: "set", value: events });
      });

      setPool(newPool);
    }
  }, [metamaskContext.status, events, pool, config]);

  return (
    <ul className="py-6">{events.filter(isMintOrSwap).map(renderEvent)}</ul>
  );
};

export default EventsFeed;
