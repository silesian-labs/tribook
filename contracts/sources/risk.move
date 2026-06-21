module tribook::risk {
    // Error codes
    const EExceedsMaxLeverage: u64 = 100;
    const EExceedsMaxBookPct: u64 = 101;
    const EInsufficientIdlePct: u64 = 102;

    // Constants
    // MAX_LEVERAGE = 2.0x (scaled by 100, so 200)
    const MAX_LEVERAGE: u64 = 200;
    // MAX_BOOK_PCT = 60%
    const MAX_BOOK_PCT: u64 = 60;
    // MIN_IDLE_PCT = 15%
    const MIN_IDLE_PCT: u64 = 15;

    /// Validates the current allocations and leverage. Reverts if risk limits are violated.
    public fun assert_risk_ok(
        total_assets: u64,
        spot_allocated: u64,
        margin_allocated: u64,
        margin_debt: u64,
        predict_allocated: u64
    ) {
        // If there are no assets, there is no risk to evaluate.
        if (total_assets == 0) {
            return
        };

        // Check MAX_BOOK_PCT (60% of total assets) for each book allocation
        assert!(spot_allocated * 100 <= total_assets * MAX_BOOK_PCT, EExceedsMaxBookPct);
        assert!(margin_allocated * 100 <= total_assets * MAX_BOOK_PCT, EExceedsMaxBookPct);
        assert!(predict_allocated * 100 <= total_assets * MAX_BOOK_PCT, EExceedsMaxBookPct);

        // Check MIN_IDLE_PCT (15% of total assets must be kept idle/unallocated)
        // Sum of all allocations must be <= 100% - MIN_IDLE_PCT
        let allocated_sum = spot_allocated + margin_allocated + predict_allocated;
        assert!(allocated_sum * 100 <= total_assets * (100 - MIN_IDLE_PCT), EInsufficientIdlePct);

        // Check MAX_LEVERAGE for Margin book (MAX_LEVERAGE = 2.0x, i.e. 200)
        // leverage = (margin_allocated + margin_debt) / margin_allocated
        // leverage * 100 <= 200 => (margin_allocated + margin_debt) * 100 <= margin_allocated * MAX_LEVERAGE
        if (margin_allocated > 0) {
            assert!(
                (margin_allocated + margin_debt) * 100 <= margin_allocated * MAX_LEVERAGE,
                EExceedsMaxLeverage
            );
        };
    }
}
