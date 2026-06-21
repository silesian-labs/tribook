#[test_only]
module tribook::tribook_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin, TreasuryCap};
    use tribook::tribook_vault::{Self, Vault};
    use tribook::tbusdc::TBUSDC;
    use tribook::risk;

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
        
        let user1_usdc = coin::mint(&mut usdc_cap, 100, ctx);
        let user1_shares = tribook_vault::deposit(&mut vault, user1_usdc, ctx);
        
        assert!(coin::value(&user1_shares) == 100, 1);
        assert!(tribook_vault::total_shares(&vault) == 100, 2);
        assert!(tribook_vault::nav_per_share(&vault) == 1_000_000, 3);
        
        let user2_usdc = coin::mint(&mut usdc_cap, 50, ctx);
        let user2_shares = tribook_vault::deposit(&mut vault, user2_usdc, ctx);
        
        assert!(coin::value(&user2_shares) == 50, 4);
        assert!(tribook_vault::total_shares(&vault) == 150, 5);
        assert!(tribook_vault::total_assets(&vault) == 150, 6);
        
        let withdrawn_usdc = tribook_vault::withdraw(&mut vault, user1_shares, ctx);
        assert!(coin::value(&withdrawn_usdc) == 100, 7);
        assert!(tribook_vault::total_shares(&vault) == 50, 8);
        assert!(tribook_vault::total_assets(&vault) == 50, 9);
        
        coin::burn(&mut usdc_cap, withdrawn_usdc);
        
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

        let dep = coin::mint(&mut usdc_cap, 100, ctx);
        let shares = tribook_vault::deposit(&mut vault, dep, ctx);

        let spot_coin = tribook_vault::allocate_spot(&mut vault, 40, ctx);
        assert!(tribook_vault::spot_allocated(&vault) == 40, 1);
        assert!(tribook_vault::idle_balance(&vault) == 60, 2);
        coin::burn(&mut usdc_cap, spot_coin);

        let returned = coin::mint(&mut usdc_cap, 50, ctx);
        tribook_vault::deallocate_spot(&mut vault, returned);

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
        risk::assert_risk_ok(100, 50, 20, 10, 10);
    }

    #[test]
    #[expected_failure(abort_code = tribook::risk::EExceedsMaxBookPct)]
    fun test_risk_book_over_cap() {
        risk::assert_risk_ok(100, 61, 0, 0, 0);
    }

    #[test]
    #[expected_failure(abort_code = tribook::risk::EExceedsMaxLeverage)]
    fun test_risk_leverage_over_cap() {
        risk::assert_risk_ok(100, 0, 20, 21, 0);
    }

    #[test]
    #[expected_failure(abort_code = tribook::risk::EInsufficientIdlePct)]
    fun test_risk_insufficient_idle_pct() {
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

        let dep = coin::mint(&mut usdc_cap, 10_000_000, ctx);
        let shares = tribook_vault::deposit(&mut vault, dep, ctx);

        let ticket = tribook::agent::start_rebalance(&vault, &agent_cap);
        
        tribook::agent::rebalance_spot_deposit(&mut vault, &agent_cap, &ticket, &mut bm, 5_000_000, ctx);

        tribook::agent::rebalance_spot_deposit(&mut vault, &agent_cap, &ticket, &mut bm, 2_000_000, ctx);

        tribook::agent::end_rebalance(&vault, &agent_cap, ticket, 0, false);

        transfer::public_transfer(shares, @0x1);
        transfer::public_transfer(usdc_cap, @0x1);
        transfer::public_transfer(agent_cap, @0x1);
        test_scenario::return_shared(bm);
        test_scenario::return_shared(vault);
        test_scenario::end(scenario);
    }
}
