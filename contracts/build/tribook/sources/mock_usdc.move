module tribook::mock_usdc {
    use sui::coin;

    public struct MOCK_USDC has drop {}

    fun init(witness: MOCK_USDC, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            6, // decimals
            b"mUSDC",
            b"Mock USDC",
            b"Mock USDC for Tribook testing",
            option::none(),
            ctx
        );
        transfer::public_share_object(metadata);
        transfer::public_transfer(treasury_cap, ctx.sender());
    }

    public entry fun mint(treasury_cap: &mut coin::TreasuryCap<MOCK_USDC>, amount: u64, recipient: address, ctx: &mut TxContext) {
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }
}
