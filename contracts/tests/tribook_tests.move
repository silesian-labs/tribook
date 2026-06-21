#[test_only]
module tribook::tribook_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin, TreasuryCap};
    use tribook::tribook_vault::{Self, Vault};
    use tribook::tbusdc::TBUSDC;
    use tribook::risk;

    // Test coin types
    public struct USDC has drop {}

    fun setup_vault(scenario: &mut Scenario): Vault<USDC> {
        let ctx = test_scenario::ctx(scenario);
        let shares_cap = coin::create_treasury_cap_for_testing<TBUSDC>(ctx);
        
        let mut bm = deepbook::balance_manager::new(ctx);
        let spot_deposit_cap = deepbook::balance_manager::mint_deposit_cap(&mut bm, ctx);
        let spot_withdraw_cap = deepbook::balance_manager::mint_withdraw_cap(&mut bm, ctx);
        let spot_trade_cap = deepbook::balance_manager::mint_trade_cap(&mut bm, ctx);
        let spot_manager_id = object::id(&bm);

        tribook_vault::create_vault<USDC>(
            shares_cap,
            spot_manager_id,
            spot_deposit_cap,
            spot_withdraw_cap,
            spot_trade_cap,
            object::id_from_address(@0x11),
            object::id_from_address(@0x12),
            ctx
        );
        sui::transfer::public_share_object(bm);
        
        test_scenario::next_tx(scenario, @0x1);
        let vault = test_scenario::take_shared<Vault<USDC>>(scenario);
        vault
    }

    #[test]
    fun test_deposit_withdraw() {
        let mut scenario = test_scenario::begin(@0x1);
        let mut vault = setup_vault(&mut scenario);
        
        let ctx = test_scenario::ctx(&mut scenario);
        let mut usdc_cap = coin::create_treasury_cap_for_testing<USDC>(ctx);
        
        // 1. First Deposit: 100 USDC
        let user1_usdc = coin::mint(&mut usdc_cap, 100, ctx);
        let user1_shares = tribook_vault::deposit(&mut vault, user1_usdc, ctx);
        
        assert!(coin::value(&user1_shares) == 100, 1);
        assert!(tribook_vault::total_shares(&vault) == 100, 2);
        assert!(tribook_vault::nav_per_share(&vault) == 1_000_000, 3); // 1.0 scaled
        
        // 2. Second Deposit: 50 USDC
        let user2_usdc = coin::mint(&mut usdc_cap, 50, ctx);
        let user2_shares = tribook_vault::deposit(&mut vault, user2_usdc, ctx);
        
        assert!(coin::value(&user2_shares) == 50, 4);
        assert!(tribook_vault::total_shares(&vault) == 150, 5);
        assert!(tribook_vault::total_assets(&vault) == 150, 6);
        
        // 3. First Withdraw: 100 shares
        let withdrawn_usdc = tribook_vault::withdraw(&mut vault, user1_shares, ctx);
        assert!(coin::value(&withdrawn_usdc) == 100, 7);
        assert!(tribook_vault::total_shares(&vault) == 50, 8);
        assert!(tribook_vault::total_assets(&vault) == 50, 9);
        
        // Clean up
        coin::burn(&mut usdc_cap, withdrawn_usdc);
        
        // Transfer objects to get rid of them safely in tests
        transfer::public_transfer(user2_shares, @0x1);
        transfer::public_transfer(usdc_cap, @0x1);
        
        test_scenario::return_shared(vault);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_deallocate_with_profit() {
        let mut scenario = test_scenario::begin(@0x1);
        let mut vault = setup_vault(&mut scenario);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut usdc_cap = coin::create_treasury_cap_for_testing<USDC>(ctx);

        // deposit 100 -> idle 100
        let dep = coin::mint(&mut usdc_cap, 100, ctx);
        let shares = tribook_vault::deposit(&mut vault, dep, ctx);

        // allocate 40 do Spot -> idle 60, spot_allocated 40, total 100
        let spot_coin = tribook_vault::allocate_spot(&mut vault, 40, ctx);
        assert!(tribook_vault::spot_allocated(&vault) == 40, 1);
        assert!(tribook_vault::idle_balance(&vault) == 60, 2);
        // symulacja: środki "poszły" do książki
        coin::burn(&mut usdc_cap, spot_coin);

        // pozycja zwraca 50 (zysk +10) -> symulujemy mintem 50 i deallokacją
        let returned = coin::mint(&mut usdc_cap, 50, ctx);
        tribook_vault::deallocate_spot(&mut vault, returned);

        // PO FIX 3: spot_allocated floored do 0, idle = 60 + 50 = 110, total = 110
        assert!(tribook_vault::spot_allocated(&vault) == 0, 3);
        assert!(tribook_vault::idle_balance(&vault) == 110, 4);
        assert!(tribook_vault::total_assets(&vault) == 110, 5);

        transfer::public_transfer(shares, @0x1);
        transfer::public_transfer(usdc_cap, @0x1);
        test_scenario::return_shared(vault);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_allocate_deallocate_roundtrip() {
        let mut scenario = test_scenario::begin(@0x1);
        let mut vault = setup_vault(&mut scenario);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut usdc_cap = coin::create_treasury_cap_for_testing<USDC>(ctx);

        let dep = coin::mint(&mut usdc_cap, 100, ctx);
        let shares = tribook_vault::deposit(&mut vault, dep, ctx);

        let c = tribook_vault::allocate_spot(&mut vault, 40, ctx);
        assert!(tribook_vault::idle_balance(&vault) == 60, 1);
        // zwrot dokładnie principal
        tribook_vault::deallocate_spot(&mut vault, c);
        assert!(tribook_vault::spot_allocated(&vault) == 0, 2);
        assert!(tribook_vault::idle_balance(&vault) == 100, 3);
        assert!(tribook_vault::total_assets(&vault) == 100, 4);

        transfer::public_transfer(shares, @0x1);
        transfer::public_transfer(usdc_cap, @0x1);
        test_scenario::return_shared(vault);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_risk_realistic_allocation_ok() {
        // total 100; 50% Spot + 20% Margin (debt 10) + 10% Predict; idle 20
        // suma wdrożona = 80 <= (100 - MIN_IDLE_PCT)=85 ; każda książka <= MAX_BOOK_PCT
        risk::assert_risk_ok(100, 50, 20, 10, 10);
    }

    #[test]
    #[expected_failure(abort_code = tribook::risk::EExceedsMaxBookPct)]
    fun test_risk_book_over_cap() {
        // Spot 61% > MAX_BOOK_PCT(60) -> revert
        risk::assert_risk_ok(100, 61, 0, 0, 0);
    }

    #[test]
    #[expected_failure(abort_code = tribook::risk::EExceedsMaxLeverage)]
    fun test_risk_leverage_over_cap() {
        // margin 20, debt 21 -> 2.05x > 2.0x
        risk::assert_risk_ok(100, 0, 20, 21, 0);
    }

    #[test]
    #[expected_failure(abort_code = tribook::risk::EInsufficientIdlePct)]
    fun test_risk_insufficient_idle_pct() {
        // total 100; Spot 40, Margin 30, Predict 20 (allocated sum = 90 > 85 limit) -> revert
        risk::assert_risk_ok(100, 40, 30, 0, 20);
    }

    #[test]
    #[expected_failure(abort_code = tribook::risk::EExceedsMaxBookPct)]
    fun test_test_atomic_rebalance_rollback() {
        let mut scenario = test_scenario::begin(@0x1);
        let mut vault = setup_vault(&mut scenario);
        
        let mut bm = test_scenario::take_shared<deepbook::balance_manager::BalanceManager>(&scenario);
        
        let ctx = test_scenario::ctx(&mut scenario);
        let mut usdc_cap = coin::create_treasury_cap_for_testing<USDC>(ctx);
        let agent_cap = tribook::agent::mint_agent_cap_for_testing(&vault, ctx);

        // deposit 10 USDC (10,000,000) -> idle 10 USDC
        let dep = coin::mint(&mut usdc_cap, 10_000_000, ctx);
        let shares = tribook_vault::deposit(&mut vault, dep, ctx);

        let ticket = tribook::agent::start_rebalance(&vault, &agent_cap);
        
        // Step 1: allocate 5 USDC (5_000_000) to Spot ( Spot limit is 60%, so 5e6 out of 10e6 total NAV is 50%, allowed)
        tribook::agent::rebalance_spot_deposit(&mut vault, &agent_cap, &ticket, &mut bm, 5_000_000, ctx);

        // Step 2: allocate another 2 USDC (2_000_000) to Spot (Total spot is 7e6 out of 10e6, exceeds 60% MAX_BOOK_PCT)
        tribook::agent::rebalance_spot_deposit(&mut vault, &agent_cap, &ticket, &mut bm, 2_000_000, ctx);

        // This call will abort with EExceedsMaxBookPct (abort code 101) in risk.move
        tribook::agent::end_rebalance(&vault, &agent_cap, ticket, 0, false);

        // Clean up
        transfer::public_transfer(shares, @0x1);
        transfer::public_transfer(usdc_cap, @0x1);
        transfer::public_transfer(agent_cap, @0x1);
        test_scenario::return_shared(bm);
        test_scenario::return_shared(vault);
        test_scenario::end(scenario);
    }
}
