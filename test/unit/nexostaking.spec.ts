import {ethers, deployments} from "hardhat"
import {BigNumber as BN, Signer} from "ethers"
import {solidity} from "ethereum-waffle"
import chai from "chai"
import {NexoStaking} from "../../typechain/NexoStaking"
import {Erc20Mock} from "../../typechain/Erc20Mock"

chai.use(solidity)
const {expect} = chai

describe("NexoStaking", async () => {
  let nexoStaking: NexoStaking
  let fakeNexo: Erc20Mock
  let fakeWBTC: Erc20Mock
  let deployer: Signer
  let alice: Signer
  let bob: Signer

  beforeEach(async () => {
    await deployments.fixture()
    ;[deployer, alice, bob] = await ethers.getSigners()

    fakeWBTC = (await ethers.getContract("WBTC")) as Erc20Mock
    fakeNexo = (await ethers.getContract("NEXO")) as Erc20Mock
    nexoStaking = (await ethers.getContract("WBTCStaking")) as NexoStaking

    await fakeNexo.mintTo(
      await alice.getAddress(),
      ethers.utils.parseUnits("888000", await fakeNexo.decimals()),
    )
    await fakeNexo.mintTo(
      await bob.getAddress(),
      ethers.utils.parseUnits("888000", await fakeNexo.decimals()),
    )
    await fakeWBTC.mintTo(
      await alice.getAddress(),
      ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
    )

    await fakeNexo
      .connect(alice)
      .approve(nexoStaking.address, ethers.constants.MaxUint256)

    await fakeNexo
      .connect(bob)
      .approve(nexoStaking.address, ethers.constants.MaxUint256)
  })

  describe("constructor & settings", () => {
    it("should set all initial state", async () => {
      expect(await nexoStaking.NEXO()).to.be.eq(fakeNexo.address)
      expect(await nexoStaking.token()).to.be.eq(fakeWBTC.address)
      expect(await nexoStaking.STAKING_LOT_PRICE()).to.be.eq(
        ethers.utils.parseUnits("888000", await fakeNexo.decimals()),
      )
      expect(await nexoStaking.totalProfit()).to.be.eq(BN.from(0))
      expect(await nexoStaking.classicLockupPeriod()).to.be.eq(BN.from(86400))
      expect(await nexoStaking.microLockupPeriod()).to.be.eq(BN.from(86400))
      expect(
        await nexoStaking.lastBoughtTimestamp(ethers.constants.AddressZero),
      ).to.be.eq(BN.from(0))
    })
  })
  describe("claimProfits", () => {
    it("revert if there is zero profit", async () => {
      await expect(
        nexoStaking.claimProfits(await alice.getAddress()),
      ).to.be.revertedWith("Zero profit")
    })
    it("should allow Bob to claim profits", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await nexoStaking.connect(alice).buyStakingLot(BN.from(1))
      await nexoStaking.connect(bob).buyStakingLot(BN.from(1))
      await fakeWBTC.connect(alice).transfer(nexoStaking.address, amount)
      await nexoStaking.connect(alice).distributeUnrealizedRewards()
      const fakeWBTCBalanceBefore = await fakeWBTC.balanceOf(
        await bob.getAddress(),
      )
      expect(fakeWBTCBalanceBefore).to.be.eq(BN.from(0))
      await nexoStaking.claimProfits(await bob.getAddress())
      const fakeWBTCBalanceAfter = await fakeWBTC.balanceOf(
        await bob.getAddress(),
      )
      expect(fakeWBTCBalanceAfter).to.be.eq(
        ethers.utils.parseUnits("5000", await fakeWBTC.decimals()),
      )
    })
  })
  describe("buy", () => {
    it("revert if the amount is zero", async () => {
      await expect(
        nexoStaking.connect(alice).buyStakingLot(BN.from(0)),
      ).to.be.revertedWith("Amount is zero")
    })
    it("revert if the amount is greater than MAX_SUPPLY", async () => {
      await expect(nexoStaking.connect(alice).buyStakingLot(BN.from(1500))).to
        .be.reverted
    })
    it("should send NEXO when buying a lot", async () => {
      const nexoBalanceBefore = await fakeNexo.balanceOf(
        await alice.getAddress(),
      )
      expect(nexoBalanceBefore).to.be.eq(
        ethers.utils.parseUnits("888000", await fakeNexo.decimals()),
      )
      await nexoStaking.connect(alice).buyStakingLot(BN.from(1))
      const nexoBalanceAfter = await fakeNexo.balanceOf(
        await alice.getAddress(),
      )
      expect(nexoBalanceAfter).to.be.eq(BN.from(0))
    })
    it("should return a token buying a lot", async () => {
      const nexoStakingBalanceBefore = await nexoStaking.balanceOf(
        await alice.getAddress(),
      )
      expect(nexoStakingBalanceBefore).to.be.eq(BN.from(0))
      await nexoStaking.connect(alice).buyStakingLot(BN.from(1))
      const nexoStakingBalanceAfter = await nexoStaking.balanceOf(
        await alice.getAddress(),
      )
      expect(nexoStakingBalanceAfter).to.be.eq(BN.from(1))
    })
  })
  describe("sell", () => {
    it("should revert if attempting to sell in the lockup period", async () => {
      await nexoStaking.connect(alice).buyStakingLot(BN.from(1))
      await expect(
        nexoStaking.connect(alice).sellStakingLot(BN.from(1)),
      ).to.be.revertedWith("The action is suspended due to the lockup")
    })
    it("should return NEXO when selling a lot", async () => {
      await nexoStaking.connect(alice).buyStakingLot(BN.from(1))
      await ethers.provider.send("evm_increaseTime", [
        BN.from(172800).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])
      await nexoStaking.connect(alice).sellStakingLot(BN.from(1))
      const nexoBalanceAfter = await fakeNexo.balanceOf(
        await alice.getAddress(),
      )
      expect(nexoBalanceAfter).to.be.eq(
        ethers.utils.parseUnits("888000", await fakeNexo.decimals()),
      )
    })
    it("should burn the lot token when selling a lot", async () => {
      await nexoStaking.connect(alice).buyStakingLot(BN.from(1))
      const nexoStakingBalanceBefore = await nexoStaking.balanceOf(
        await alice.getAddress(),
      )
      expect(nexoStakingBalanceBefore).to.be.eq(BN.from(1))
      await ethers.provider.send("evm_increaseTime", [
        BN.from(172800).toNumber(),
      ])
      await ethers.provider.send("evm_mine", [])
      await nexoStaking.connect(alice).sellStakingLot(BN.from(1))
      const nexoStakingBalanceAfter = await nexoStaking.balanceOf(
        await alice.getAddress(),
      )
      expect(nexoStakingBalanceAfter).to.be.eq(BN.from(0))
    })
  })
  describe("profitOf", () => {
    it("return the profit for an account", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await nexoStaking.connect(alice).buyStakingLot(BN.from(1))
      await nexoStaking.connect(bob).buyStakingLot(BN.from(1))
      await fakeWBTC.connect(alice).transfer(nexoStaking.address, amount)
      await nexoStaking.connect(alice).distributeUnrealizedRewards()
      const profit = await nexoStaking
        .connect(alice)
        .profitOf(await alice.getAddress())
      expect(profit).to.be.eq(
        ethers.utils.parseUnits("5000", await fakeWBTC.decimals()),
      )
    })
  })
  describe("distributeUnrealizedRewards", () => {
    it("should allow another account to send profit", async () => {
      await nexoStaking.connect(alice).buyStakingLot(BN.from(1))
      const fakeWBTCBalanceBefore = await fakeWBTC.balanceOf(
        await alice.getAddress(),
      )
      expect(fakeWBTCBalanceBefore).to.be.eq(
        ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
      )
      await fakeWBTC
        .connect(alice)
        .transfer(
          nexoStaking.address,
          ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
        )
      await nexoStaking.connect(alice).distributeUnrealizedRewards()

      const fakeWBTCBalanceAfter = await fakeWBTC.balanceOf(
        await alice.getAddress(),
      )
      expect(fakeWBTCBalanceAfter).to.be.eq(BN.from(0))
    })
    it("should receive profit sent", async () => {
      await nexoStaking.connect(alice).buyStakingLot(BN.from(1))
      const fakeWBTCBalanceBefore = await fakeWBTC.balanceOf(
        nexoStaking.address,
      )
      expect(fakeWBTCBalanceBefore).to.be.eq(BN.from(0))
      await fakeWBTC
        .connect(alice)
        .transfer(
          nexoStaking.address,
          ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
        )
      await nexoStaking.connect(alice).distributeUnrealizedRewards()

      const fakeWBTCBalanceAfter = await fakeWBTC.balanceOf(
        nexoStaking.address,
      )
      expect(fakeWBTCBalanceAfter).to.be.eq(
        ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
      )
    })
    it("should send all to basic lots if there are no micro lots", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await nexoStaking.connect(alice).buyStakingLot(1)
      await fakeWBTC.connect(alice).transfer(nexoStaking.address, amount)
      await nexoStaking.connect(alice).distributeUnrealizedRewards()
      expect(await nexoStaking.profitOf(await alice.getAddress())).to.be.eq(
        amount,
      )
    })
    it("should send all to micro lots if there are no basic lots", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await nexoStaking.connect(alice).buyMicroLot("1000")
      await fakeWBTC.connect(alice).transfer(nexoStaking.address, amount)
      await nexoStaking.connect(alice).distributeUnrealizedRewards()
      expect(await nexoStaking.profitOf(await alice.getAddress())).to.be.eq(
        amount,
      )
    })
    it("should send all to FALLBACK RECIPIENT if there are no any lots", async () => {
      const totalProfitBefore = await nexoStaking.totalProfit()
      expect(totalProfitBefore).to.be.eq(BN.from(0))
      const microLotsProfitsBefore = await nexoStaking.microLotsProfits()
      expect(microLotsProfitsBefore).to.be.eq(BN.from(0))
      await fakeWBTC
        .connect(alice)
        .transfer(
          nexoStaking.address,
          ethers.utils.parseUnits("10000", await fakeWBTC.decimals()),
        )
      await expect(
        nexoStaking.connect(alice).distributeUnrealizedRewards(),
      ).not.to.emit(nexoStaking, "Profit")
      const totalProfitAfter = await nexoStaking.totalProfit()
      expect(totalProfitAfter).to.be.eq(totalProfitBefore).to.be.eq(BN.from(0))
      const microLotsProfitsAfter = await nexoStaking.microLotsProfits()
      expect(microLotsProfitsAfter)
        .to.be.eq(microLotsProfitsBefore)
        .to.be.eq(BN.from(0))
    })
    it("should emit a Profit event", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await nexoStaking.connect(alice).buyStakingLot(BN.from(1))
      await fakeWBTC.connect(alice).transfer(nexoStaking.address, amount)
      await expect(nexoStaking.connect(alice).distributeUnrealizedRewards())
        .to.emit(nexoStaking, "Profit")
        .withArgs(amount)
    })
    it("should update totalProfit", async () => {
      const amount = ethers.utils.parseUnits("10000", await fakeWBTC.decimals())
      await nexoStaking.connect(alice).buyStakingLot(BN.from(1))
      await nexoStaking.connect(bob).buyStakingLot(BN.from(1))
      await fakeWBTC.connect(alice).transfer(nexoStaking.address, amount)
      await nexoStaking.connect(alice).distributeUnrealizedRewards()
      expect(await nexoStaking.totalProfit()).to.be.eq(
        amount.mul(BN.from(10).pow(30)).div(2),
      )
    })
    it("should send 20% of profit to microlots", async () => {
      await nexoStaking.connect(alice).buyMicroLot(1000)
      await nexoStaking.connect(bob).buyStakingLot(1)
      await fakeWBTC.connect(alice).transfer(nexoStaking.address, 100000)
      await nexoStaking.connect(alice).distributeUnrealizedRewards()
      expect(await nexoStaking.profitOf(await alice.getAddress())).to.be.eq(
        20000,
      )
    })
    it("should send 80% of profit to lots", async () => {
      await nexoStaking.connect(alice).buyMicroLot(1000)
      await nexoStaking.connect(bob).buyStakingLot(1)
      await fakeWBTC.connect(alice).transfer(nexoStaking.address, 100000)
      await nexoStaking.connect(alice).distributeUnrealizedRewards()
      expect(await nexoStaking.profitOf(await bob.getAddress())).to.be.eq(
        80000,
      )
    })
    it("should distribute profit correctly", async () => {
      await fakeNexo
        .connect(deployer)
        .approve(nexoStaking.address, ethers.constants.MaxUint256)
      await fakeNexo.connect(deployer).mint(ethers.utils.parseUnits("8880000"))
      await fakeWBTC
        .connect(deployer)
        .mint(ethers.utils.parseUnits("100000", 8))

      await fakeWBTC
        .connect(deployer)
        .approve(nexoStaking.address, ethers.constants.MaxUint256)

      await nexoStaking
        .connect(deployer)
        .buyMicroLot(ethers.utils.parseUnits("900"))
      await nexoStaking.connect(deployer).buyStakingLot(4)

      await nexoStaking.connect(alice).buyStakingLot(1)
      await nexoStaking
        .connect(bob)
        .buyMicroLot(ethers.utils.parseUnits("100"))

      await fakeWBTC.connect(deployer).transfer(nexoStaking.address, 100000)
      await nexoStaking.connect(deployer).distributeUnrealizedRewards()
      // 10% from 20% from 100 000 = 0.1 * 0.2 * 100 000 = 2 000
      expect(await nexoStaking.profitOf(await bob.getAddress())).to.be.eq(2000)
      // 20% from 80% from 100 000 = 0.2 * 0.8 * 100 000 = 16 000
      expect(await nexoStaking.profitOf(await alice.getAddress())).to.be.eq(
        16000,
      )
      // 90% from 20% from 100 000 and 80% from 80% from 100 000 =
      // = 0.9 * 0.2 * 100 000 + 0.8 * 0.8 * 100 = 82 000
      expect(await nexoStaking.profitOf(await deployer.getAddress())).to.be.eq(
        82000,
      )
    })
  })
})
