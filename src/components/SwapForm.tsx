import "./SwapForm.css";
import { Contract, ethers } from "ethers";
import { useContext, useEffect, useState } from "react";
import { MetaMaskContext } from "../contexts/MetaMask";

const tokens = ["WETH", "USDC"];

const TokenList = (props: any) => {
  return (
    <select defaultValue={props.selected}>
      {tokens.map((t) => (
        <option key={t}>{t}</option>
      ))}
    </select>
  );
};

const addLiquidity = (
  account: any,
  { token0, token1, manager }: any,
  { managerAddress, poolAddress }: any,
) => {
  if (!token0 || !token1) {
    return;
  }

  const amount0 = ethers.parseEther("0.998976618347425280");
  const amount1 = ethers.parseEther("5000");
  const lowerTick = 84222;
  const upperTick = 86129;
  const liquidity = ethers.toBigInt("1517882343751509868544");
  const extra = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "address"],
    [token0.address, token1.address, account],
  );

  Promise.all([
    token0.allowance(account, managerAddress),
    token1.allowance(account, managerAddress),
  ]).then(async ([allowance0, allowance1]) => {
    return Promise.resolve()
      .then(() => {
        if (allowance0.lt(amount0)) {
          return token0
            .approve(managerAddress, amount0)
            .then((tx: any) => tx.wait());
        }
      })
      .then(() => {
        if (allowance1.lt(amount1)) {
          return token1
            .approve(managerAddress, amount1)
            .then((tx: any) => tx.wait());
        }
      })
      .then(() => {
        return manager
          .mint(poolAddress, lowerTick, upperTick, liquidity, extra)
          .then((tx: any) => tx.wait());
      })
      .then(() => {
        alert("Liquidity added!");
      })
      .catch((err) => {
        console.error(err);
        alert("Failed!");
      });
  });
};

const swap = (
  amountIn: any,
  account: any,
  { tokenIn, manager, token0, token1 }: any,
  { managerAddress, poolAddress }: any,
) => {
  const amountInWei = ethers.parseEther(amountIn);
  const extra = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "address"],
    [token0.address, token1.address, account],
  );

  tokenIn
    .allowance(account, managerAddress)
    .then((allowance: any) => {
      if (allowance.lt(amountInWei)) {
        return tokenIn
          .approve(managerAddress, amountInWei)
          .then((tx: any) => tx.wait());
      }
    })
    .then(() => {
      return manager.swap(poolAddress, extra).then((tx: any) => tx.wait());
    })
    .then(() => {
      alert("Swap succeeded!");
    })
    .catch((err: any) => {
      console.error(err);
      alert("Failed");
    });
};

const SwapForm = (props: any) => {
  const metamaskContext = useContext(MetaMaskContext);
  const enabled = metamaskContext.status === "connected";

  const amount0 = 0.008396714242162444;
  const amount1 = 42;

  const [token0, setToken0] = useState<Contract>();
  const [token1, setToken1] = useState<Contract>();
  const [manager, setManager] = useState<Contract>();

  useEffect(() => {
    async function fetchData() {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const token0Contract = new Contract(
        props.config.token0Address,
        props.config.ABIs.ERC20,
        provider,
      );
      const token1Contract = new Contract(
        props.config.token1Address,
        props.config.ABIs.ERC20,
        provider,
      );
      const managerContract = new Contract(
        props.config.managerAddress,
        props.config.ABIs.Manager,
        provider,
      );
      setToken0(token0Contract);
      setToken1(token1Contract);
      setManager(managerContract);
    }

    fetchData();
  }, []);

  const addLiquidity_ = () => {
    addLiquidity(
      metamaskContext.account,
      { token0, token1, manager },
      props.config,
    );
  };

  const swap_ = (e: any) => {
    e.preventDefault();
    swap(
      amount1.toString(),
      metamaskContext.account,
      { tokenIn: token1, manager, token0, token1 },
      props.config,
    );
  };

  return (
    <section className="SwapContainer">
      <header>
        <h1>Swap tokens</h1>
        <button disabled={!enabled} onClick={addLiquidity_}>
          Add Liquidity
        </button>
      </header>
      <form className="SwapForm">
        <fieldset>
          <input type="text" placeholder="0.0" value={amount1} readOnly />
          <TokenList selected="USDC" />
        </fieldset>

        <fieldset>
          <input type="text" placeholder="0.0" value={amount0} readOnly />
          <TokenList selected="WETH" />
        </fieldset>
        <button disabled={!enabled} onClick={swap_}>
          Swap
        </button>
      </form>
    </section>
  );
};

export default SwapForm;
