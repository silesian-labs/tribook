module tribook::tbusdc {
    use sui::coin;

    public struct TBUSDC has drop {}

    fun init(otw: TBUSDC, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency(
            otw,
            6,
            b"tbUSDC",
            b"Tribook USDC",
            b"Shares representation of Tribook USDC Vault",
            option::none(),
            ctx
        );
        transfer::public_share_object(metadata);
        transfer::public_transfer(treasury_cap, ctx.sender());
    }
}
