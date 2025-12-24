export interface DeltaTransaction {
    id: string;
    assetId: string;
    assetSymbol: string;
    amountWithGst: number;
    gst: number;
    balance: number;
    transactionType: string;
    contractFund: string;
    referenceId: string;
    date: string;
    timestamp: number;
}

export interface TradeFromCSV {
    id: string;
    symbol: string;
    amount: number;
    timestamp: number;
    dateStr: string;
    type: 'profit' | 'loss';
}

export interface PortfolioStats {
    currentBalance: number;
    totalDeposits: number;
    totalPnL: number;
    totalFees: number;
    totalLiquidationFees: number;
    totalFunding: number;
    trades: TradeFromCSV[];
    transactions: DeltaTransaction[];
}

export function parseCSV(csvText: string): DeltaTransaction[] {
    const lines = csvText.trim().split('\n');
    const transactions: DeltaTransaction[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length < 10) continue;

        try {
            const transaction: DeltaTransaction = {
                id: parts[0],
                assetId: parts[1],
                assetSymbol: parts[2],
                amountWithGst: parseFloat(parts[3]) || 0,
                gst: parseFloat(parts[4]) || 0,
                balance: parseFloat(parts[5]) || 0,
                transactionType: parts[6],
                contractFund: parts[7],
                referenceId: parts[8],
                date: parts[9],
                timestamp: new Date(parts[9]).getTime()
            };
            transactions.push(transaction);
        } catch (e) {
            console.warn('Failed to parse line:', line);
        }
    }

    return transactions;
}

export function calculatePortfolioStats(transactions: DeltaTransaction[]): PortfolioStats {
    let totalDeposits = 0;
    let totalFees = 0;
    let totalLiquidationFees = 0;
    let totalFunding = 0;
    const trades: TradeFromCSV[] = [];

    // Get current balance from most recent transaction
    const currentBalance = transactions.length > 0 ? transactions[0].balance : 0;

    transactions.forEach((tx) => {
        switch (tx.transactionType) {
            case 'deposit':
                totalDeposits += tx.amountWithGst;
                break;

            case 'trading fees':
                totalFees += Math.abs(tx.amountWithGst);
                break;

            case 'liquidation_fee':
                totalLiquidationFees += Math.abs(tx.amountWithGst);
                break;

            case 'funding':
                totalFunding += tx.amountWithGst;
                break;

            case 'cashflow':
                // This represents actual trade P&L
                trades.push({
                    id: tx.id,
                    symbol: tx.contractFund || 'UNKNOWN',
                    amount: tx.amountWithGst,
                    timestamp: tx.timestamp,
                    dateStr: tx.date.split(' ')[0],
                    type: tx.amountWithGst >= 0 ? 'profit' : 'loss'
                });
                break;
        }
    });

    // Total P&L = Current Balance - Total Deposits
    const totalPnL = currentBalance - totalDeposits;

    return {
        currentBalance,
        totalDeposits,
        totalPnL,
        totalFees,
        totalLiquidationFees,
        totalFunding,
        trades: trades.sort((a, b) => b.timestamp - a.timestamp),
        transactions
    };
}

export function loadCSVFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            resolve(text);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
