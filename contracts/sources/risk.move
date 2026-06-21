module tribook::risk {
    const EExceedsMaxLeverage: u64 = 100;
    const EExceedsMaxBookPct: u64 = 101;
    const EInsufficientIdlePct: u64 = 102;

    const MAX_LEVERAGE: u64 = 200;
    const MAX_BOOK_PCT: u64 = 60;
    const MIN_IDLE_PCT: u64 = 15;

    public fun assert_risk_ok(
        total_assets: u64,
        spot_allocated: u64,
        margin_allocated: u64,
        margin_debt: u64,
        predict_allocated: u64
    ) {
        if (total_assets == 0) {
            return
        };

        assert!(spot_allocated * 100 <= total_assets * MAX_BOOK_PCT, EExceedsMaxBookPct);
        assert!(margin_allocated * 100 <= total_assets * MAX_BOOK_PCT, EExceedsMaxBookPct);
        assert!(predict_allocated * 100 <= total_assets * MAX_BOOK_PCT, EExceedsMaxBookPct);

        let allocated_sum = spot_allocated + margin_allocated + predict_allocated;
        assert!(allocated_sum * 100 <= total_assets * (100 - MIN_IDLE_PCT), EInsufficientIdlePct);

        if (margin_allocated > 0) {
            assert!(
                (margin_allocated + margin_debt) * 100 <= margin_allocated * MAX_LEVERAGE,
                EExceedsMaxLeverage
            );
        };
    }
}
