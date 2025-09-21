import { HardhatRuntimeEnvironment } from "hardhat/types"
import { UniswapV2Pair } from "../typechain/UniswapV2Pair"
import { WethMock } from "../typechain/WethMock"
import { Erc20Mock } from "../typechain/Erc20Mock"

import { bytecode as UniswapV2FactoryBytecode } from "@uniswap/v2-core/build/UniswapV2Factory.json"

async function deployment(hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts, ethers, network } = hre
  const { deploy, save, getArtifact } = deployments
  const { deployer } = await getNamedAccounts()

  if (network.name === "ropsten" || network.name === "mainnet") {
    console.log("UniswapRouter deployed on ropsten/mainnet at 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D")
    await save("UniswapRouter", {
      address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      abi: (await getArtifact("UniswapV2Router01")).abi,
    })
  } else {
    const WETH = (await ethers.getContract("WETH")) as WethMock
    const WBTC = (await ethers.getContract("WBTC")) as Erc20Mock
    const USDC = (await ethers.getContract("USDC")) as Erc20Mock
    const tokens = [WETH.address, WBTC.address, USDC.address]

    const amounts: Record<string, Record<string, [any, any]>> = {
      [WBTC.address]: {
        [WETH.address]: [
          ethers.utils.parseUnits("100", 8),
          ethers.utils.parseUnits("2000", 18),
        ],
      },
      [USDC.address]: {
        [WETH.address]: [
          ethers.utils.parseUnits("2500000", 6),
          ethers.utils.parseUnits("1000", 18),
        ],
        [WBTC.address]: [
          ethers.utils.parseUnits("5000000", 6),
          ethers.utils.parseUnits("100", 8),
        ],
      },
    }

    // Minimal factory with required methods, deployed from bytecode
    const UniswapV2Factory = await ethers.getContractFactory(
      [
        "constructor(address _feeToSetter)",
        "function createPair(address tokenA, address tokenB) external returns (address pair)",
        "function getPair(address tokenA, address tokenB) external view returns (address pair)",
      ],
      UniswapV2FactoryBytecode,
    )

    const factory = await UniswapV2Factory.deploy(deployer)

    await deploy("UniswapRouter", {
      contract: "UniswapV2Router01",
      from:
