module tribook::agent {
    use sui::coin::Coin;
    use sui::clock::Clock;
    use tribook::tribook_vault::{Self, Vault};
    use tribook::risk;

    use deepbook::balance_manager::BalanceManager;
    use deepbook_margin::margin_manager::MarginManager;
    use deepbook_margin::margin_pool::MarginPool;
    use deepbook_margin::margin_registry::MarginRegistry;
    use deepbook::pool::Pool;
    use pyth::price_info::PriceInfoObject;

    const EInvalidVault: u64 = 1;
    const EInvalidAgentCap: u64 = 2;
    const EInvalidManager: u64 = 3;

    public struct AdminCap has key, store {
        id: UID,
    }

    public struct AgentCap has key, store {
        id: UID,
        vault_id: ID,
    }

    public struct RebalanceTicket {
        vault_id: ID,
    }

    public struct RebalanceExecuted has copy, drop {
        spot: u64,
        margin: u64,
        predict: u64,
        nav_after: u64,
        leverage: u64,
        delta_abs: u64,
        delta_is_positive: bool,
    }

    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap { id: object::new(ctx) };
        transfer::public_transfer(admin_cap, ctx.sender());
    }
    public fun mint_agent_cap<USDC>(
        _admin: &AdminCap,
        vault: &Vault<USDC>,
        ctx: &mut TxContext
    ): AgentCap {
        AgentCap {
            id: object::new(ctx),
            vault_id: object::id(vault),
        }
    }

    #[test_only]
    public fun mint_agent_cap_for_testing<USDC>(
        vault: &Vault<USDC>,
        ctx: &mut TxContext
    ): AgentCap {
        AgentCap {
            id: object::new(ctx),
            vault_id: object::id(vault),
        }
    }
    public fun start_rebalance<USDC>(
        vault: &Vault<USDC>,
        cap: &AgentCap
    ): RebalanceTicket {
        assert!(object::id(vault) == cap.vault_id, EInvalidVault);
        RebalanceTicket {
            vault_id: cap.vault_id,
        }
    }
    public fun rebalance_spot_deposit<USDC>(
        vault: &mut Vault<USDC>,
        cap: &AgentCap,
        ticket: &RebalanceTicket,
        balance_manager: &mut BalanceManager,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(object::id(vault) == cap.vault_id, EInvalidVault);
        assert!(ticket.vault_id == cap.vault_id, EInvalidAgentCap);
        assert!(object::id(balance_manager) == tribook_vault::spot_manager_id(vault), EInvalidManager);
        
        let coin = tribook_vault::allocate_spot(vault, amount, ctx);
        let deposit_cap = tribook_vault::borrow_spot_deposit_cap(vault);
        deepbook::balance_manager::deposit_with_cap(balance_manager, deposit_cap, coin, ctx);
    }

    public fun rebalance_spot_withdraw<USDC>(
        vault: &mut Vault<USDC>,
        cap: &AgentCap,
        ticket: &RebalanceTicket,
        balance_manager: &mut BalanceManager,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(object::id(vault) == cap.vault_id, EInvalidVault);
        assert!(ticket.vault_id == cap.vault_id, EInvalidAgentCap);
        assert!(object::id(balance_manager) == tribook_vault::spot_manager_id(vault), EInvalidManager);
        
        let withdraw_cap = tribook_vault::borrow_spot_withdraw_cap(vault);
        let coin = deepbook::balance_manager::withdraw_with_cap<USDC>(
            balance_manager,
            withdraw_cap,
            amount,
            ctx
        );
        tribook_vault::deallocate_spot(vault, coin);
    }

    fun generate_spot_trade_proof<USDC>(
        vault: &Vault<USDC>,
        balance_manager: &mut BalanceManager,
        ctx: &TxContext
    ): deepbook::balance_manager::TradeProof {
        deepbook::balance_manager::generate_proof_as_trader(
            balance_manager,
            tribook_vault::borrow_spot_trade_cap(vault),
            ctx
        )
    }

    public fun rebalance_margin_deposit<USDC, BaseAsset, QuoteAsset>(
        vault: &mut Vault<USDC>,
        cap: &AgentCap,
        ticket: &RebalanceTicket,
        margin_manager: &mut MarginManager<BaseAsset, QuoteAsset>,
        registry: &MarginRegistry,
        base_oracle: &PriceInfoObject,
        quote_oracle: &PriceInfoObject,
        clock: &Clock,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(object::id(vault) == cap.vault_id, EInvalidVault);
        assert!(ticket.vault_id == cap.vault_id, EInvalidAgentCap);
        assert!(object::id(margin_manager) == tribook_vault::margin_manager_id(vault), EInvalidManager);
        
        let coin = tribook_vault::allocate_margin(vault, amount, ctx);
        deepbook_margin::margin_manager::deposit<BaseAsset, QuoteAsset, USDC>(
            margin_manager,
            registry,
            base_oracle,
            quote_oracle,
            coin,
            clock,
            ctx
        );
    }

    public fun rebalance_margin_withdraw<USDC, BaseAsset, QuoteAsset>(
        vault: &mut Vault<USDC>,
        cap: &AgentCap,
        ticket: &RebalanceTicket,
        margin_manager: &mut MarginManager<BaseAsset, QuoteAsset>,
        registry: &MarginRegistry,
        base_margin_pool: &MarginPool<BaseAsset>,
        quote_margin_pool: &MarginPool<QuoteAsset>,
        base_oracle: &PriceInfoObject,
        quote_oracle: &PriceInfoObject,
        pool: &Pool<BaseAsset, QuoteAsset>,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(object::id(vault) == cap.vault_id, EInvalidVault);
        assert!(ticket.vault_id == cap.vault_id, EInvalidAgentCap);
        assert!(object::id(margin_manager) == tribook_vault::margin_manager_id(vault), EInvalidManager);
        
        let coin = deepbook_margin::margin_manager::withdraw<BaseAsset, QuoteAsset, USDC>(
            margin_manager,
            registry,
            base_margin_pool,
            quote_margin_pool,
            base_oracle,
            quote_oracle,
            pool,
            amount,
            clock,
            ctx
        );
        tribook_vault::deallocate_margin(vault, coin);
    }

    public fun end_rebalance<USDC>(
        vault: &Vault<USDC>,
        cap: &AgentCap,
        ticket: RebalanceTicket,
        delta_abs: u64,
        delta_is_positive: bool
    ) {
        assert!(object::id(vault) == cap.vault_id, EInvalidVault);
        let RebalanceTicket { vault_id: _ } = ticket;

        assert!(tribook_vault::margin_allocated(vault) == 0, EInvalidManager);

        let total_assets = tribook_vault::total_assets(vault);
        let spot = tribook_vault::spot_allocated(vault);
        let margin = tribook_vault::margin_allocated(vault);
        let debt = tribook_vault::margin_debt(vault);
        let predict = tribook_vault::predict_allocated(vault);

        risk::assert_risk_ok(total_assets, spot, margin, debt, predict);

        sui::event::emit(RebalanceExecuted {
            spot,
            margin,
            predict,
            nav_after: tribook_vault::nav_per_share(vault),
            leverage: 0,
            delta_abs,
            delta_is_positive,
        });
    }

    public fun end_rebalance_with_margin<USDC, BaseAsset, QuoteAsset>(
        vault: &mut Vault<USDC>,
        cap: &AgentCap,
        ticket: RebalanceTicket,
        margin_manager: &MarginManager<BaseAsset, QuoteAsset>,
        margin_pool: &MarginPool<USDC>,
        clock: &Clock,
        delta_abs: u64,
        delta_is_positive: bool
    ) {
        assert!(object::id(vault) == cap.vault_id, EInvalidVault);
        let RebalanceTicket { vault_id: _ } = ticket;

        assert!(object::id(margin_manager) == tribook_vault::margin_manager_id(vault), EInvalidManager);
        let (base_debt, quote_debt) = if (deepbook_margin::margin_manager::margin_pool_id(margin_manager).is_none()) {
            (0, 0)
        } else {
            deepbook_margin::margin_manager::calculate_debts<BaseAsset, QuoteAsset, USDC>(
                margin_manager,
                margin_pool,
                clock
            )
        };
        tribook_vault::set_margin_debt(vault, base_debt + quote_debt);

        let total_assets = tribook_vault::total_assets(vault);
        let spot = tribook_vault::spot_allocated(vault);
        let margin = tribook_vault::margin_allocated(vault);
        let debt = tribook_vault::margin_debt(vault);
        let predict = tribook_vault::predict_allocated(vault);

        risk::assert_risk_ok(total_assets, spot, margin, debt, predict);

        let leverage = if (margin > 0) {
            (((margin + debt) as u128) * 100 / (margin as u128)) as u64
        } else {
            0
        };

        sui::event::emit(RebalanceExecuted {
            spot,
            margin,
            predict,
            nav_after: tribook_vault::nav_per_share(vault),
            leverage,
            delta_abs,
            delta_is_positive,
        });
    }

public fun rebalance_spot_place_order<USDC, BaseAsset, QuoteAsset>(
    vault: &Vault<USDC>,
    cap: &AgentCap,
    ticket: &RebalanceTicket,
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    balance_manager: &mut BalanceManager,
    client_order_id: u64,
    order_type: u8,
    self_matching_option: u8,
    price: u64,
    quantity: u64,
    is_bid: bool,
    pay_with_deep: bool,
    expire_timestamp: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(object::id(vault) == cap.vault_id, EInvalidVault);
    assert!(ticket.vault_id == cap.vault_id, EInvalidAgentCap);
    assert!(object::id(balance_manager) == tribook_vault::spot_manager_id(vault), EInvalidManager);

    let proof = generate_spot_trade_proof(vault, balance_manager, ctx);

    let _order_info = deepbook::pool::place_limit_order<BaseAsset, QuoteAsset>(
        pool,
        balance_manager,
        &proof,
        client_order_id,
        order_type,
        self_matching_option,
        price,
        quantity,
        is_bid,
        pay_with_deep,
        expire_timestamp,
        clock,
        ctx,
    );
}
}
