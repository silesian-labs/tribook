module tribook::tribook_vault {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin, TreasuryCap};
    use tribook::tbusdc::TBUSDC;
    use deepbook::balance_manager::{DepositCap, WithdrawCap, TradeCap};

    const EInsufficientIdleBalance: u64 = 1;

    public struct DepositEvent has copy, drop {
        user: address,
        usdc_in: u64,
        shares_out: u64,
    }

    public struct WithdrawEvent has copy, drop {
        user: address,
        shares_in: u64,
        usdc_out: u64,
    }

    public struct Vault<phantom USDC> has key {
        id: UID,
        usdc_balance: Balance<USDC>,
        total_shares: u64,
        spot_allocated: u64,
        margin_allocated: u64,
        margin_debt: u64,
        predict_allocated: u64,
        shares_cap: TreasuryCap<TBUSDC>,
        spot_manager_id: ID,
        spot_deposit_cap: DepositCap,
        spot_withdraw_cap: WithdrawCap,
        spot_trade_cap: TradeCap,
        margin_manager_id: ID,
        predict_manager_id: ID,
    }

    public fun create_vault<USDC>(
        shares_cap: TreasuryCap<TBUSDC>,
        spot_manager_id: ID,
        spot_deposit_cap: DepositCap,
        spot_withdraw_cap: WithdrawCap,
        spot_trade_cap: TradeCap,
        margin_manager_id: ID,
        predict_manager_id: ID,
        ctx: &mut TxContext
    ) {
        let vault = Vault<USDC> {
            id: object::new(ctx),
            usdc_balance: balance::zero(),
            total_shares: 0,
            spot_allocated: 0,
            margin_allocated: 0,
            margin_debt: 0,
            predict_allocated: 0,
            shares_cap,
            spot_manager_id,
            spot_deposit_cap,
            spot_withdraw_cap,
            spot_trade_cap,
            margin_manager_id,
            predict_manager_id,
        };
        transfer::share_object(vault);
    }

    public fun deposit<USDC>(
        vault: &mut Vault<USDC>,
        coin: Coin<USDC>,
        ctx: &mut TxContext
    ): Coin<TBUSDC> {
        let amount = coin.value();
        let nav = total_assets(vault);
        
        let shares = if (vault.total_shares == 0) {
            amount
        } else {
            (((amount as u128) * (vault.total_shares as u128)) / (nav as u128)) as u64
        };
        
        vault.usdc_balance.join(coin.into_balance());
        
        let shares_coin = coin::mint(&mut vault.shares_cap, shares, ctx);
        vault.total_shares = vault.total_shares + shares;
        
        sui::event::emit(DepositEvent {
            user: ctx.sender(),
            usdc_in: amount,
            shares_out: shares,
        });
        
        shares_coin
    }

    public fun withdraw<USDC>(
        vault: &mut Vault<USDC>,
        shares_coin: Coin<TBUSDC>,
        ctx: &mut TxContext
    ): Coin<USDC> {
        let shares = shares_coin.value();
        let nav = total_assets(vault);
        
        let amount = (((shares as u128) * (nav as u128)) / (vault.total_shares as u128)) as u64;
        
        assert!(vault.usdc_balance.value() >= amount, EInsufficientIdleBalance);

        coin::burn(&mut vault.shares_cap, shares_coin);
        vault.total_shares = vault.total_shares - shares;
        
        let balance_to_withdraw = vault.usdc_balance.split(amount);
        let coin_to_withdraw = coin::from_balance(balance_to_withdraw, ctx);
        
        sui::event::emit(WithdrawEvent {
            user: ctx.sender(),
            shares_in: shares,
            usdc_out: amount,
        });
        
        coin_to_withdraw
    }


    public fun total_assets<USDC>(vault: &Vault<USDC>): u64 {
        let allocated = vault.spot_allocated + vault.margin_allocated + vault.predict_allocated;
        let balance_val = vault.usdc_balance.value();
        if (allocated + balance_val > vault.margin_debt) {
            allocated + balance_val - vault.margin_debt
        } else {
            0
        }
    }

    public fun nav_per_share<USDC>(vault: &Vault<USDC>): u64 {
        if (vault.total_shares == 0) {
            1_000_000
        } else {
            (((total_assets(vault) as u128) * 1_000_000) / (vault.total_shares as u128)) as u64
        }
    }

    public fun total_shares<USDC>(vault: &Vault<USDC>): u64 {
        vault.total_shares
    }

    public fun spot_allocated<USDC>(vault: &Vault<USDC>): u64 {
        vault.spot_allocated
    }

    public fun margin_allocated<USDC>(vault: &Vault<USDC>): u64 {
        vault.margin_allocated
    }

    public fun margin_debt<USDC>(vault: &Vault<USDC>): u64 {
        vault.margin_debt
    }

    public fun predict_allocated<USDC>(vault: &Vault<USDC>): u64 {
        vault.predict_allocated
    }

    public fun idle_balance<USDC>(vault: &Vault<USDC>): u64 {
        vault.usdc_balance.value()
    }

    public fun spot_manager_id<USDC>(vault: &Vault<USDC>): ID {
        vault.spot_manager_id
    }

    public(package) fun borrow_spot_deposit_cap<USDC>(vault: &Vault<USDC>): &DepositCap {
        &vault.spot_deposit_cap
    }

    public(package) fun borrow_spot_withdraw_cap<USDC>(vault: &Vault<USDC>): &WithdrawCap {
        &vault.spot_withdraw_cap
    }

    public(package) fun borrow_spot_trade_cap<USDC>(vault: &Vault<USDC>): &TradeCap {
        &vault.spot_trade_cap
    }

    public fun margin_manager_id<USDC>(vault: &Vault<USDC>): ID {
        vault.margin_manager_id
    }

    public fun predict_manager_id<USDC>(vault: &Vault<USDC>): ID {
        vault.predict_manager_id
    }


    public(package) fun allocate_spot<USDC>(
        vault: &mut Vault<USDC>,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<USDC> {
        assert!(vault.usdc_balance.value() >= amount, EInsufficientIdleBalance);
        vault.spot_allocated = vault.spot_allocated + amount;
        let bal = vault.usdc_balance.split(amount);
        coin::from_balance(bal, ctx)
    }

    public(package) fun deallocate_spot<USDC>(vault: &mut Vault<USDC>, coin: Coin<USDC>) {
        let val = coin.value();
        if (val > vault.spot_allocated) {
            vault.spot_allocated = 0;
        } else {
            vault.spot_allocated = vault.spot_allocated - val;
        };
        vault.usdc_balance.join(coin.into_balance());
    }

    public(package) fun allocate_margin<USDC>(
        vault: &mut Vault<USDC>,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<USDC> {
        assert!(vault.usdc_balance.value() >= amount, EInsufficientIdleBalance);
        vault.margin_allocated = vault.margin_allocated + amount;
        let bal = vault.usdc_balance.split(amount);
        coin::from_balance(bal, ctx)
    }

    public(package) fun deallocate_margin<USDC>(vault: &mut Vault<USDC>, coin: Coin<USDC>) {
        let val = coin.value();
        if (val > vault.margin_allocated) {
            vault.margin_allocated = 0;
        } else {
            vault.margin_allocated = vault.margin_allocated - val;
        };
        vault.usdc_balance.join(coin.into_balance());
    }

    public(package) fun allocate_predict<USDC>(
        vault: &mut Vault<USDC>,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<USDC> {
        assert!(vault.usdc_balance.value() >= amount, EInsufficientIdleBalance);
        vault.predict_allocated = vault.predict_allocated + amount;
        let bal = vault.usdc_balance.split(amount);
        coin::from_balance(bal, ctx)
    }

    public(package) fun deallocate_predict<USDC>(vault: &mut Vault<USDC>, coin: Coin<USDC>) {
        let val = coin.value();
        if (val > vault.predict_allocated) {
            vault.predict_allocated = 0;
        } else {
            vault.predict_allocated = vault.predict_allocated - val;
        };
        vault.usdc_balance.join(coin.into_balance());
    }

    public(package) fun set_margin_debt<USDC>(vault: &mut Vault<USDC>, new_debt: u64) {
        vault.margin_debt = new_debt;
    }
}
