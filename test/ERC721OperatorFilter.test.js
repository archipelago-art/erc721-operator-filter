const { expect } = require("chai");

describe("ERC721OperatorFilter", () => {
  let BlacklistOperatorFilter;
  let TestERC721WithOperatorFilter;
  let TransferProxy;
  before(async () => {
    BlacklistOperatorFilter = await ethers.getContractFactory(
      "BlacklistOperatorFilter"
    );
    TestERC721WithOperatorFilter = await ethers.getContractFactory(
      "TestERC721WithOperatorFilter"
    );
    TransferProxy = await ethers.getContractFactory("TransferProxy");
  });

  const recipient = "0x" + "55".repeat(20);

  async function setUp() {
    const [owner, nonOwner, tokenHolder] = await ethers.getSigners();
    const contract = await TestERC721WithOperatorFilter.deploy();
    return { contract, owner, nonOwner, tokenHolder };
  }

  it("filter can be set by the owner", async () => {
    const { contract, owner } = await setUp();
    const filter = await BlacklistOperatorFilter.deploy();
    await contract.setOperatorFilter(filter.address);
    expect(await contract.operatorFilter()).to.equal(filter.address);
  });

  it("filter can't be set by non-owners", async () => {
    const { contract, owner, nonOwner } = await setUp();
    const filter = await BlacklistOperatorFilter.deploy();
    await expect(
      contract.connect(nonOwner).setOperatorFilter(filter.address)
    ).to.be.revertedWith("Ownable:");
    expect(await contract.operatorFilter()).to.equal(
      ethers.constants.AddressZero
    );
  });

  it("permits minting when a filter is set", async () => {
    const { contract, owner, tokenHolder } = await setUp();
    const filter = await BlacklistOperatorFilter.deploy();
    await contract.setOperatorFilter(filter.address);
    await contract.mint(tokenHolder.address, 1);
  });

  it("permits burning when a filter is set", async () => {
    const { contract, owner, tokenHolder } = await setUp();
    await contract.mint(tokenHolder.address, 1);
    const filter = await BlacklistOperatorFilter.deploy();
    await contract.setOperatorFilter(filter.address);
    await contract.burn(1);
  });

  it("always permits the owner to transfer their token", async () => {
    const { contract, owner, tokenHolder } = await setUp();
    const filter = await BlacklistOperatorFilter.deploy();
    await contract.setOperatorFilter(filter.address);
    await filter.setAddressBlocked(tokenHolder.address, true);
    await contract.mint(tokenHolder.address, 1);
    expect(await filter.mayTransfer(tokenHolder.address)).to.equal(false);
    // Should be allowed even though the operator is blacklisted, because the
    // operator is also the owner.
    await contract
      .connect(tokenHolder)
      .transferFrom(tokenHolder.address, recipient, 1);
    expect(await contract.ownerOf(1)).to.equal(recipient);
  });

  it("always allows transferring tokens when no filter is set", async () => {
    const { contract, owner, tokenHolder } = await setUp();
    await contract.mint(tokenHolder.address, 1);
    const proxy = await TransferProxy.deploy();
    await contract.connect(tokenHolder).setApprovalForAll(proxy.address, true);
    await proxy
      .connect(tokenHolder)
      .transferFrom(contract.address, tokenHolder.address, recipient, 1);
    expect(await contract.ownerOf(1)).to.equal(recipient);
  });

  it("permits some other operators to transfer tokens", async () => {
    const { contract, owner, tokenHolder } = await setUp();
    // Install a filter, but don't block anything.
    const filter = await BlacklistOperatorFilter.deploy();
    await contract.setOperatorFilter(filter.address);
    await contract.mint(tokenHolder.address, 1);
    const proxy = await TransferProxy.deploy();
    await contract.connect(tokenHolder).setApprovalForAll(proxy.address, true);
    await proxy
      .connect(tokenHolder)
      .transferFrom(contract.address, tokenHolder.address, recipient, 1);
    expect(await contract.ownerOf(1)).to.equal(recipient);
  });

  it("blocks some other operators from transferring tokens", async () => {
    const { contract, owner, tokenHolder } = await setUp();
    const filter = await BlacklistOperatorFilter.deploy();
    await contract.setOperatorFilter(filter.address);
    await contract.mint(tokenHolder.address, 1);
    const proxy = await TransferProxy.deploy();
    await contract.connect(tokenHolder).setApprovalForAll(proxy.address, true);
    await filter.setAddressBlocked(proxy.address, true);
    await expect(
      proxy
        .connect(tokenHolder)
        .transferFrom(contract.address, tokenHolder.address, recipient, 1)
    ).to.be.revertedWith("ERC721OperatorFilter: illegal operator");
    expect(await contract.ownerOf(1)).to.equal(tokenHolder.address);
  });
});
