// import {ethers, deployments} from "hardhat"
// import {BigNumber as BN, Signer} from "ethers"
// import {solidity} from "ethereum-waffle"
// import chai from "chai"
// import {NexoPool} from "../../typechain/NexoPool"
// import {NexoOptions} from "../../typechain/NexoOptions"
// import {Erc20Mock} from "../../typechain/Erc20Mock"
// import {NexoRewards} from "../../typechain/NexoRewards"
//
// chai.use(solidity)
// const {expect} = chai
//
// describe("NexoRewards", async () => {
//   let nexoPoolWBTC: NexoPool
//   let nexoPoolUSDC: NexoPool
//   let nexoOptions: NexoOptions
//   let fakeNexo: Erc20Mock
//   let fakeUSDC: Erc20Mock
//   let fakeWBTC: Erc20Mock
//   let nexoRewards: NexoRewards
//   let alice: Signer
//
//   beforeEach(async () => {
//     await deployments.fixture()
//     ;[, alice] = await ethers.getSigners()
//
//     nexoPoolWBTC = (await ethers.getContract("NexoWBTCPool")) as NexoPool
//     nexoPoolUSDC = (await ethers.getContract("NexoUSDCPool")) as NexoPool
//     nexoOptions = (await ethers.getContract("WBTCOptions")) as NexoOptions
//     fakeNexo = (await ethers.getContract("NEXO")) as Erc20Mock
//     fakeUSDC = (await ethers.getContract("USDC")) as Erc20Mock
//     fakeWBTC = (await ethers.getContract("WBTC")) as Erc20Mock
//     nexoRewards = (await ethers.getContract("WBTCRewards")) as NexoRewards
//
//     await fakeNexo.mintTo(
//       await alice.getAddress(),
//       ethers.utils.parseUnits("888000", await fakeNexo.decimals()),
//     )
//
//     await fakeUSDC.mintTo(
//       await alice.getAddress(),
//       ethers.utils.parseUnits("1000000", await fakeUSDC.decimals()),
//     )
//
//     await fakeWBTC.mintTo(
//       await alice.getAddress(),
//       ethers.utils.parseUnits("1000000", await fakeWBTC.decimals()),
//     )
//
//     await fakeWBTC
//       .connect(alice)
//       .approve(nexoPoolWBTC.address, ethers.constants.MaxUint256)
//
//     await nexoPoolWBTC
//       .connect(alice)
//       .provideFrom(
//         await alice.getAddress(),
//         BN.from(100000),
//         true,
//         BN.from(100000),
//       )
//
//     await fakeUSDC
//       .connect(alice)
//       .approve(nexoPoolUSDC.address, ethers.constants.MaxUint256)
//
//     await nexoPoolUSDC
//       .connect(alice)
//       .provideFrom(
//         await alice.getAddress(),
//         BN.from(100000),
//         true,
//         BN.from(100000),
//       )
//   })
//
//   describe("constructor & settings", async () => {
//     it("should set all initial state", async () => {
//       expect(await nexoRewards.nexoOptions()).to.eq(nexoOptions.address)
//       expect(await nexoRewards.nexo()).to.eq(fakeNexo.address)
//       expect(await nexoRewards.rewardsRate()).to.eq(BN.from(10).pow(24))
//     })
//   })
//
//   describe("setRewardsRate", async () => {
//     it("should revert if the caller is not the owner", async () => {
//       await expect(
//         nexoRewards.connect(alice).setRewardsRate(BN.from(10).pow(10)),
//       ).to.be.revertedWith("caller is not the owner")
//     })
//     it("should revert if the rewards rate is less than MIN_REWARDS_RATE", async () => {
//       await expect(nexoRewards.setRewardsRate(BN.from(10).pow(6))).to.be
//         .reverted
//     })
//     it("should revert if the rewards rate is greater than MAX_REWARDS_RATE", async () => {
//       await expect(nexoRewards.setRewardsRate(BN.from(10).pow(25))).to.be
//         .reverted
//     })
//     it("should set the rewards rate correctly", async () => {
//       const rewardsRateBefore = await nexoRewards.rewardsRate()
//       expect(rewardsRateBefore).to.equal(BN.from(10).pow(24))
//       await nexoRewards.setRewardsRate(BN.from(10).pow(10))
//       const hedgeRewardsAfter = await nexoRewards.rewardsRate()
//       expect(hedgeRewardsAfter).to.be.eq(BN.from(10).pow(10))
//     })
//   })
// })
