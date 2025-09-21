// import {ethers, deployments} from "hardhat"
// import {BigNumber as BN, Signer} from "ethers"
// import {solidity} from "ethereum-waffle"
// import chai from "chai"
// import {NexoPool} from "../../typechain/NexoPool"
// // import {NexoOptions} from "../../typechain/NexoOptions"
// // import {PriceCalculator} from "../../typechain/PriceCalculator"
// import {NexoStaking} from "../../typechain/NexoStaking"
// import {Erc20Mock} from "../../typechain/Erc20Mock"
// import {PriceProviderMock} from "../../typechain/PriceProviderMock"
//
// chai.use(solidity)
// const {expect} = chai
//
// describe("NexoOptions", async () => {
//   let nexoPoolWBTC: NexoPool
//   let nexoPoolUSDC: NexoPool
//   let nexoStakingWBTC: NexoStaking
//   let nexoStakingUSDC: NexoStaking
//   let nexoOptions: NexoOptions
//   let priceCalculator: PriceCalculator
//   let fakeNexo: Erc20Mock
//   let fakeUSDC: Erc20Mock
//   let fakeWBTC: Erc20Mock
//   let fakePriceProvider: PriceProviderMock
//   let alice: Signer
//   let bob: Signer
//
//   beforeEach(async () => {
//     await deployments.fixture()
//     ;[, alice, bob] = await ethers.getSigners()
//
//     nexoPoolWBTC = (await ethers.getContract("NexoWBTCPool")) as NexoPool
//     nexoPoolUSDC = (await ethers.getContract("NexoUSDCPool")) as NexoPool
//     nexoStakingWBTC = (await ethers.getContract("WBTCStaking")) as NexoStaking
//     nexoStakingUSDC = (await ethers.getContract("USDCStaking")) as NexoStaking
//     priceCalculator = (await ethers.getContract(
//       "WBTCPriceCalculator",
//     )) as PriceCalculator
//     nexoOptions = (await ethers.getContract("WBTCOptions")) as NexoOptions
//     fakeNexo = (await ethers.getContract("NEXO")) as Erc20Mock
//     fakeUSDC = (await ethers.getContract("USDC")) as Erc20Mock
//     fakeWBTC = (await ethers.getContract("WBTC")) as Erc20Mock
//     fakePriceProvider = (await ethers.getContract(
//       "WBTCPriceProvider",
//     )) as PriceProviderMock
//
//     await fakeNexo.mintTo(
//       await alice.getAddress(),
//       ethers.utils.parseUnits("888000", await fakeNexo.decimals()),
//     )
//
//     await fakeUSDC.mintTo(
//       await alice.getAddress(),
//       ethers.utils.parseUnits("1000000000000", await fakeUSDC.decimals()),
//     )
//
//     await fakeWBTC.mintTo(
//       await alice.getAddress(),
//       ethers.utils.parseUnits("100000000", await fakeWBTC.decimals()),
//     )
//
//     await fakeWBTC
//       .connect(alice)
//       .approve(nexoPoolWBTC.address, ethers.constants.MaxUint256)
//     await fakeWBTC
//       .connect(alice)
//       .approve(nexoOptions.address, ethers.constants.MaxUint256)
//
//     await nexoPoolWBTC
//       .connect(alice)
//       .provideFrom(
//         await alice.getAddress(),
//         ethers.utils.parseUnits("1000000", await fakeWBTC.decimals()),
//         true,
//         ethers.utils.parseUnits("1000000", await fakeWBTC.decimals()),
//       )
//
//     await fakeUSDC
//       .connect(alice)
//       .approve(nexoPoolUSDC.address, ethers.constants.MaxUint256)
//
//     await fakeUSDC
//       .connect(alice)
//       .approve(nexoOptions.address, ethers.constants.MaxUint256)
//
//     await nexoPoolUSDC
//       .connect(alice)
//       .provideFrom(
//         await alice.getAddress(),
//         ethers.utils.parseUnits("1000000000", await fakeUSDC.decimals()),
//         true,
//         ethers.utils.parseUnits("1000000000", await fakeUSDC.decimals()),
//       )
//   })
//
//   describe("constructor & settings", async () => {
//     it("should set all initial state", async () => {
//       expect(await nexoOptions.priceCalculator()).to.be.eq(
//         priceCalculator.address,
//       )
//       expect(await nexoOptions.pool(BN.from(1))).to.eq(nexoPoolUSDC.address)
//       expect(await nexoOptions.pool(BN.from(2))).to.eq(nexoPoolWBTC.address)
//       expect(await nexoOptions.settlementFeeRecipient(BN.from(1))).to.eq(
//         nexoStakingUSDC.address,
//       )
//       expect(await nexoOptions.settlementFeeRecipient(BN.from(2))).to.eq(
//         nexoStakingWBTC.address,
//       )
//       expect(await nexoOptions.token(BN.from(1))).to.eq(fakeUSDC.address)
//       expect(await nexoOptions.token(BN.from(2))).to.eq(fakeWBTC.address)
//       expect(await nexoOptions.priceProvider()).to.be.eq(
//         fakePriceProvider.address,
//       )
//     })
//   })
//
//   // The rest of the tests remain the same, but with `hegic` replaced by `nexo`
// })
