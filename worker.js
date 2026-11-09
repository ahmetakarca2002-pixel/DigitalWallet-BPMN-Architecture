const { Client, logger, Variables } = require('camunda-external-task-client-js');
const sqlite3 = require('sqlite3').verbose();
const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const http = require('http');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const db = new sqlite3.Database('./bank.db', (err) => {
    if (err) console.error('Veritabanına bağlanılamadı:', err.message);
    else {
        db.configure('busyTimeout', 5000); 
        db.run('PRAGMA journal_mode = WAL;');
    }
});
const currentHour = new Date().getHours();
const isOutOfHours = (currentHour >= 17 || currentHour < 9);


// REST API Uç Noktası (Cüzdan verilerini çekme)
app.get('/api/wallet/:customerId', (req, res) => {
    const customerId = req.params.customerId;
    
    // 1. Müşteriye ait TÜM hesapları çek
    db.all(`SELECT id, account_type, account_number, balance, currency, swift_code, iban, total_loyalty_points, customer_type, days_to_maturity FROM Accounts WHERE customer_id = ?`, [customerId], (err, accountsList) => {
        if (err || !accountsList || accountsList.length === 0) return res.status(404).json({ error: "Hesap bulunamadı" });
        
        // Müşterinin tüm IBAN'larını bir diziye (array) alıyoruz
        const ibans = accountsList.map(a => a.iban);
        const placeholders = ibans.map(() => '?').join(',');
        
        // 2. Bu IBAN'lardan HERHANGİ BİRİNİN geçtiği TÜM işlemleri getir
        db.all(`SELECT * FROM Transactions WHERE sender_iban IN (${placeholders}) OR receiver_iban IN (${placeholders}) ORDER BY id DESC`, [...ibans, ...ibans], (err, transactions) => {
            
            // Dashboard Ana Bakiyesini tüm hesapların toplamı olarak göstermek için:
            const totalBalance = accountsList.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
            
            const mainAccount = accountsList[0];

            res.json({ 
                balance: totalBalance, // Toplam Cüzdan Bakiyesi
                loyaltyPoints: mainAccount.total_loyalty_points || 0,
                customerType: mainAccount.customer_type || 'STANDART',
                transactions: transactions || [],
                accounts: accountsList || [] 
            });
        });
    });
});

// --- DIŞ TRANSFER BAŞLATMA (Havale/EFT) ---
app.post('/api/external-transfer', (req, res) => {
    const { customerId, fromAccountNumber, receiver, amount, paymentType, paymentDescription, transactionDate } = req.body;
    const numericAmount = parseFloat(amount); 

    db.get(`SELECT account_type, customer_type, iban, currency FROM Accounts WHERE customer_id = ? AND account_number = ?`, [customerId, fromAccountNumber], async (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Gönderici hesabı bulunamadı" });

        try {
            const camundaResponse = await axios.post('http://localhost:8081/engine-rest/process-definition/key/MoneyTransferProcess/start', {
                variables: {
                    isOutOfHours: { value: isOutOfHours, type: "Boolean" },
                    senderId: { value: customerId, type: "String" },
                    senderIban: { value: row.iban, type: "String" },
                    recipientIban: { value: receiver, type: "String" },
                    amount: { value: numericAmount, type: "Double" },
                    customerType: { value: row.customer_type || "STANDART", type: "String" },
                    paymentType: { value: paymentType || "Diğer", type: "String" }, 
                    paymentDescription: { value: paymentDescription || "", type: "String" }, 
                    transactionDate: { value: transactionDate || new Date().toISOString(), type: "String" },

                    senderAccountType: { value: row.account_type, type: "String" },
                    senderCurrency: { value: row.currency || "TRY", type: "String" },
                    receiverCurrency: { value: "TRY", type: "String" }, 
                    isInterestLossAccepted: { value: false, type: "Boolean" }
                }
            });
            res.status(200).json({ success: true, processInstanceId: camundaResponse.data.id, message: `Dış transfer süreci başlatıldı.` });
        } catch (error) {
            console.error("Camunda başlatma hatası:", error.response?.data || error.message);
            res.status(500).json({ error: "Transfer başlatılamadı" });
        }
    });
});

// --- HESAPLARIM ARASI TRANSFER (İç Transfer) ---
app.post('/api/internal-transfer', async (req, res) => {
    const { customerId, fromAccountNumber, toAccountNumber, amount, paymentDescription, transactionDate } = req.body;
    const numericAmount = parseFloat(amount);

    db.all(`SELECT account_number, account_type, currency FROM Accounts WHERE customer_id = ? AND account_number IN (?, ?)`, [customerId, fromAccountNumber, toAccountNumber], async (err, rows) => {
        if (err || !rows || rows.length < 2) return res.status(404).json({ error: "Hesaplar bulunamadı" });
        
        const senderAcc = rows.find(r => r.account_number === fromAccountNumber);
        const receiverAcc = rows.find(r => r.account_number === toAccountNumber);

        try {
            const camundaResponse = await axios.post('http://localhost:8081/engine-rest/process-definition/key/InternalTransferProcess/start', {
                variables: {
                    customerId: { value: customerId, type: "String" },
                    fromAccountNumber: { value: fromAccountNumber, type: "String" },
                    toAccountNumber: { value: toAccountNumber, type: "String" },
                    amount: { value: numericAmount, type: "Double" },
                    paymentDescription: { value: paymentDescription || "", type: "String" },
                    transactionDate: { value: transactionDate || new Date().toISOString(), type: "String" },
                    isOutOfHours: { value: isOutOfHours, type: "Boolean" },
                    
                    senderAccountType: { value: senderAcc.account_type, type: "String" },
                    senderCurrency: { value: senderAcc.currency || "TRY", type: "String" },
                    receiverCurrency: { value: receiverAcc.currency || "TRY", type: "String" }
                }
            });
            res.status(200).json({ success: true, processInstanceId: camundaResponse.data.id, message: "Hesaplarım arası transfer süreci başlatıldı." });
        } catch (error) {
            console.error("Camunda iç transfer başlatma hatası:", error.response?.data || error.message);
            res.status(500).json({ error: "Transfer başlatılamadı" });
        }
    });
});

// --- SWIFT (Uluslararası) TRANSFER BAŞLATMA ---
app.post('/api/swift-transfer', (req, res) => {
    const { customerId, fromAccountNumber, receiverIban, receiverName, swiftCode, currency, expenseType, purpose, amount, paymentDescription, transactionDate } = req.body;
    const numericAmount = parseFloat(amount); 

    db.get(`SELECT account_type, customer_type, iban, currency FROM Accounts WHERE customer_id = ? AND account_number = ?`, [customerId, fromAccountNumber], async (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Gönderici hesabı bulunamadı" });

        try {
            const camundaResponse = await axios.post('http://localhost:8081/engine-rest/process-definition/key/SwiftTransferProcess/start', {
                variables: {
                    senderId: { value: customerId, type: "String" },
                    senderIban: { value: row.iban, type: "String" },
                    recipientIban: { value: receiverIban, type: "String" },
                    amount: { value: numericAmount, type: "Double" },
                    customerType: { value: row.customer_type || "STANDART", type: "String" },
                    paymentType: { value: "SWIFT", type: "String" }, 
                    paymentDescription: { value: paymentDescription || "", type: "String" }, 
                    transactionDate: { value: transactionDate || new Date().toISOString(), type: "String" },
                    
                    swiftCode: { value: swiftCode, type: "String" },
                    currency: { value: currency, type: "String" },
                    expenseType: { value: expenseType, type: "String" },
                    transferPurpose: { value: purpose, type: "String" },

                    senderAccountType: { value: row.account_type, type: "String" },
                    senderCurrency: { value: row.currency || "TRY", type: "String" },
                    receiverCurrency: { value: currency, type: "String" }
                }
            });
            res.status(200).json({ success: true, processInstanceId: camundaResponse.data.id, message: `SWIFT süreci başlatıldı.` });
        } catch (error) {
            console.error("Camunda SWIFT başlatma hatası:", error.response?.data || error.message);
            res.status(500).json({ error: "Camunda SWIFT süreci bulunamadı." });
        }
    });
});

// --- YENİ HESAP AÇILIŞ SÜRECİ BAŞLATMA ---
app.post('/api/open-account', (req, res) => {
    const { customerId, sourceAccountNumber, senderAccountType, senderCurrency, receiverAccountType, receiverCurrency, amount, daysToMaturity, isCurrencyConverted, isAccountExpired } = req.body;
    
    db.get(`SELECT iban, customer_type FROM Accounts WHERE customer_id = ? AND account_number = ?`, [customerId, sourceAccountNumber], async (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Gönderici hesabı bulunamadı" });

        try {
            const camundaResponse = await axios.post('http://localhost:8081/engine-rest/process-definition/key/vadeliParaTransferi/start', {
                variables: {
                    senderId: { value: customerId, type: "String" },
                    fromAccountNumber: { value: sourceAccountNumber, type: "String" },
                    amount: { value: parseFloat(amount), type: "Double" },
                    senderIban: { value: row.iban, type: "String" }, 
                    recipientIban: { value: "YENİ HESAP", type: "String" }, 
                    customerType: { value: row.customer_type || "STANDART", type: "String" }, 
                    paymentType: { value: "Hesap Açılışı", type: "String" }, 
                    paymentDescription: { value: "İlk Bakiye Aktarımı", type: "String" },
                    transactionDate: { value: new Date().toISOString(), type: "String" },
                    
                    daysToMaturity: { value: parseInt(daysToMaturity) || 0, type: "Integer" },
                    isOutOfHours: { value: isOutOfHours, type: "Boolean" },
                    
                    senderAccountType: { value: senderAccountType, type: "String" },
                    receiverAccountType: { value: receiverAccountType, type: "String" },
                    senderCurrency: { value: senderCurrency, type: "String" },
                    receiverCurrency: { value: receiverCurrency, type: "String" },
                    isCurrencyConverted: { value: isCurrencyConverted, type: "Boolean" },
                    isAccountExpired: { value: isAccountExpired || false, type: "Boolean" },
                    isInterestLossAccepted: { value: false, type: "Boolean" }
                }
            });
            res.status(200).json({ success: true, processInstanceId: camundaResponse.data.id });
        } catch (error) {
            console.error("Hesap açma süreci başlatılamadı:", error.response?.data?.message || error.message);
            res.status(500).json({ error: "Süreç başlatılamadı" });
        }
    });
});

io.on('connection', (socket) => {
    console.log('📱 React Native istemcisi bağlandı. Socket ID:', socket.id);
});

server.listen(3000, () => {
    console.log('🔌 API ve WebSocket sunucusu 3000 portunda dinliyor.');
});

// 2. Camunda Ayarları
const config = { baseUrl: 'http://localhost:8081/engine-rest', use: logger, asyncResponseTimeout: 10000 };
const client = new Client(config);
console.log("⚙️ Camunda Worker Başladı... İşler bekleniyor.");

const safeComplete = async (taskService, task, variables) => {
    try {
        if (variables) await taskService.complete(task, variables);
        else await taskService.complete(task);
    } catch (e) {
        console.error(`\n🔥 [KRİTİK HATA] Camunda Görev Tamamlama Başarısız! Detay: ${e.message}`);
    }
};

const safeFailure = async (taskService, task, errorMessage) => {
    try {
        await taskService.handleFailure(task, { errorMessage });
    } catch (e) {
        console.error(`\n🔥 [KRİTİK HATA] Görev Başarısızlığı Bildirilemedi: ${e.message}`);
    }
};

const safeBpmnError = async (taskService, task, errorCode, errorMessage) => {
    try {
        await taskService.handleBpmnError(task, errorCode, errorMessage);
    } catch (e) {
        console.error(`\n🔥 [KRİTİK HATA] BPMN Hatası Fırlatılamadı: ${e.message}`);
    }
};

// --- GÖREV 1: Bakiye Kontrolü ve Parayı Askıya Alma (Provizyon) ---
client.subscribe('check-balance-aml', async ({ task, taskService }) => {
    const amount = parseFloat(task.variables.get('amount'));
    const senderIban = task.variables.get('senderIban'); 
    const recipientIban = task.variables.get('recipientIban');
    
    const paymentType = task.variables.get('paymentType');
    const paymentDescription = task.variables.get('paymentDescription');
    const transactionDate = task.variables.get('transactionDate');
    
    const transferPurpose = task.variables.get('transferPurpose') || null;
    const expenseType = task.variables.get('expenseType') || null;

    const processId = task.processInstanceId;
    const feeAmount = parseFloat(task.variables.get('feeAmount')) || 0;
    const customerType = task.variables.get('customerType');
    const totalDeduction = amount + feeAmount;

    console.log(`\n💰 [BAKİYE KONTROLÜ] Müşteri: ${customerType} | Transfer: ${amount} | Tür: ${paymentType}`);

    db.get(`SELECT balance FROM Accounts WHERE iban = ?`, [senderIban], async (err, row) => {
        if (row && row.balance >= totalDeduction) {
            console.log(`✅ [KONTROL BAŞARILI] Bakiyeden anında ${totalDeduction} düşülüyor...`);
            
            db.serialize(() => {
                db.run(`UPDATE Accounts SET balance = balance - ? WHERE iban = ?`, [totalDeduction, senderIban]);
                db.run(`INSERT INTO Transactions (sender_iban, receiver_iban, amount, fee_amount, loyalty_points, status, camunda_process_id, payment_type, payment_description, transaction_date, transfer_purpose, expense_type) 
                        VALUES (?, ?, ?, ?, 0, 'PENDING', ?, ?, ?, ?, ?, ?)`, 
                [senderIban, recipientIban, amount, feeAmount, processId, paymentType, paymentDescription, transactionDate, transferPurpose, expenseType]);
            });

            const processVariables = new Variables();
            processVariables.set('totalDeduction', totalDeduction);
            await safeComplete(taskService, task, processVariables);
        } else {
            console.log(`\n❌ [KONTROL BAŞARISIZ] Gönderici yetersiz bakiye!`);
            await safeFailure(taskService, task, "Yetersiz bakiye");
        }
    });
});

// --- GÖREV 2: Transfer Onaylandığında (Para Alıcıya Geçer) ---
client.subscribe('execute-transfer', async ({ task, taskService }) => {
    const amount = parseFloat(task.variables.get('amount'));
    const recipientIdentifier = task.variables.get('recipientIban'); 
    const processId = task.processInstanceId;

    console.log(`\n💸 [TRANSFER ONAYLANDI] Para alıcıya aktarılıyor ve işlem tamamlanıyor...`);

    db.serialize(() => {
        db.run(`UPDATE Accounts SET balance = balance + ? WHERE iban = ? OR account_number = ? OR account_phone = ?`, 
        [amount, recipientIdentifier, recipientIdentifier, recipientIdentifier]);

        db.run(`UPDATE Transactions SET status = 'COMPLETED' WHERE camunda_process_id = ?`, [processId], async () => {
            io.emit('transfer-approved', { amount: amount, message: 'İşlem onaylandı.' });
            await safeComplete(taskService, task);
        });
    });
});

// --- GÖREV 3: Zaman Aşımı / İptal Durumu ---
client.subscribe('transfer-timeout', async ({ task, taskService }) => {
    const amount = parseFloat(task.variables.get('amount'));
    const feeAmount = parseFloat(task.variables.get('feeAmount')) || 0;
    const totalDeduction = parseFloat(task.variables.get('totalDeduction')) || (amount + feeAmount); 

    const senderIban = task.variables.get('senderIban'); 
    const processId = task.processInstanceId;
    const rejectionReason = task.variables.get('rejectionReason') || "Zaman Aşımı / İptal";

    console.log(`⏰ [İPTAL DURUMU] ${totalDeduction} birim iade ediliyor. Sebep: ${rejectionReason}`);

    db.serialize(async () => {
        db.run(`UPDATE Accounts SET balance = balance + ? WHERE iban = ?`, [totalDeduction, senderIban]);
        db.run(`UPDATE Transactions SET status = 'REJECTED' WHERE camunda_process_id = ?`, [processId], async () => {
            io.emit('transfer-timeout', { amount: amount, message: rejectionReason });
            await safeComplete(taskService, task);
        });
    });
});

// --- GÖREV 4: Müşteriye Eşzamanlı SMS Gönderme ---
client.subscribe('send-sms', async ({ task, taskService }) => {
    const amount = parseFloat(task.variables.get('amount'));
    const senderId = task.variables.get('senderId');

    console.log(`\n✉️ [SMS SİSTEMİ TETİKLENDİ] ${senderId} telefonuna mesaj iletiliyor: "Sayın müşterimiz, ${amount} birim tutarındaki transferiniz başarıyla gerçekleşmiştir."`);
    await safeComplete(taskService, task);
});

// --- GÖREV 5: Alt Süreç - Dolandırıcılık (Fraud) Kontrolü ---
client.subscribe('check-fraud', async ({ task, taskService }) => {
    const amount = parseFloat(task.variables.get('amount'));
    const recipientIban = task.variables.get('recipientIban');
    const blacklistedIbans = ["TR999999999999999999999999", "TR111111111111111111111111"];

    console.log(`\n🛡️ [GÜVENLİK KONTROLÜ] ${recipientIban} numaralı alıcı IBAN'ı taranıyor...`);

    if (blacklistedIbans.includes(recipientIban)) {
        console.log(`🚨 [FRAUD ALARMI] Şüpheli IBAN tespit edildi! İşlem anında bloke ediliyor.`);
        io.emit('transfer-timeout', { amount: amount, message: 'İşlem güvenlik politikası gereği reddedildi.' });
        await safeBpmnError(taskService, task, 'FRAUD_ERROR', 'Kara listeye alınmış IBAN.');
    } else {
        console.log(`✅ [GÜVENLİK ONAYI] IBAN temiz. Süreç devam ediyor.`);
        await safeComplete(taskService, task);
    }
});

// --- GÖREV 6: Alt Süreç - Sadakat Puanı ---
client.subscribe('add-cashback-points', async ({ task, taskService }) => {
    const amount = parseFloat(task.variables.get('amount'));
    const senderId = task.variables.get('senderId');
    const processId = task.processInstanceId;
    const cashbackRate = parseFloat(task.variables.get('cashbackRate')) || 0;
    
    if (cashbackRate > 0) {
        const cashbackAmount = amount * cashbackRate;
        console.log(`\n🎁 [CASHBACK] ${senderId} kullanıcısına ${cashbackAmount} Puan yüklendi.`);
        
        db.serialize(async () => {
            db.run(`UPDATE Accounts SET total_loyalty_points = COALESCE(total_loyalty_points, 0) + ? WHERE customer_id = ?`, [cashbackAmount, senderId]);
            db.get(`SELECT iban FROM Accounts WHERE customer_id = ?`, [senderId], async (err, row) => {
                if (row) {
                    db.run(`INSERT INTO Transactions (sender_iban, receiver_iban, amount, fee_amount, loyalty_points, status, camunda_process_id) VALUES (?, 'SİSTEM - ÖDÜL', 0, 0, ?, 'COMPLETED', ?)`, 
                    [row.iban, cashbackAmount, processId]);
                }
                await safeComplete(taskService, task);
            });
        });
    } else {
        console.log(`\n🎁 [CASHBACK] ${senderId} STANDART müşteri olduğu için puan yüklenmedi.`);
        await safeComplete(taskService, task);
    }
});

// =======================================================================
// HESAPLARIM ARASI TRANSFER (INTERNAL TRANSFER PROCESS)
// =======================================================================
client.subscribe('internal-validate-balance', async ({ task, taskService }) => {
    const customerId = task.variables.get('customerId');
    const fromAccountNo = task.variables.get('fromAccountNumber');
    const toAccountNo = task.variables.get('toAccountNumber');
    const amount = parseFloat(task.variables.get('amount'));

    console.log(`\n🔍 [İÇ TRANSFER KONTROL] ${customerId} | ${fromAccountNo} -> ${toAccountNo} | Tutar: ${amount} ₺`);

    db.all(`SELECT * FROM Accounts WHERE customer_id = ? AND account_number IN (?, ?)`, [customerId, fromAccountNo, toAccountNo], async (err, accounts) => {
        if (err || !accounts || accounts.length < 2) return await safeFailure(taskService, task, "Hesap yetkilendirme hatası");

        const senderAcc = accounts.find(a => a.account_number === fromAccountNo);
        const receiverAcc = accounts.find(a => a.account_number === toAccountNo);

        if (senderAcc.balance >= amount) {
            const processVariables = new Variables();
            processVariables.set('senderIban', senderAcc.iban);
            processVariables.set('receiverIban', receiverAcc.iban);
            await safeComplete(taskService, task, processVariables);
        } else {
            await safeFailure(taskService, task, "Yetersiz bakiye");
        }
    });
});

client.subscribe('internal-execute-transfer', async ({ task, taskService }) => {
    const amount = parseFloat(task.variables.get('amount'));
    const fromAccountNo = task.variables.get('fromAccountNumber');
    const toAccountNo = task.variables.get('toAccountNumber');
    const senderIban = task.variables.get('senderIban');
    const receiverIban = task.variables.get('receiverIban');
    const paymentDescription = task.variables.get('paymentDescription'); 
    const transactionDate = task.variables.get('transactionDate'); 
    const processId = task.processInstanceId;

    db.serialize(() => {
        db.run(`UPDATE Accounts SET balance = balance - ? WHERE account_number = ?`, [amount, fromAccountNo]);
        db.run(`UPDATE Accounts SET balance = balance + ? WHERE account_number = ?`, [amount, toAccountNo]);
        
        db.run(`INSERT INTO Transactions (sender_iban, receiver_iban, amount, fee_amount, loyalty_points, status, camunda_process_id, payment_description, transaction_date) 
                VALUES (?, ?, ?, 0, 0, 'COMPLETED', ?, ?, ?)`, 
        [senderIban, receiverIban, amount, processId, paymentDescription, transactionDate], async (err) => {
            if (!err) {
                io.emit('transfer-approved', { amount: amount, message: 'İç transfer başarıyla gerçekleşti.' });
                await safeComplete(taskService, task);
            } else {
                await safeFailure(taskService, task, "Veritabanı kayıt hatası");
            }
        });
    });
});

client.subscribe('internal-send-sms', async ({ task, taskService }) => {
    const amount = parseFloat(task.variables.get('amount'));
    const customerId = task.variables.get('customerId');
    console.log(`\n✉️ [SMS SİSTEMİ TETİKLENDİ] ${customerId} telefonuna mesaj iletiliyor: "Sayın müşterimiz, hesaplarınız arası ${amount} TL tutarındaki transferiniz başarıyla gerçekleşmiştir."`);
    await safeComplete(taskService, task);
});

client.subscribe('create-account-db', async ({ task, taskService }) => {
    const senderId = task.variables.get('senderId');
    const receiverAccountType = task.variables.get('receiverAccountType');
    const receiverCurrency = task.variables.get('receiverCurrency');
    const amount = parseFloat(task.variables.get('amount'));
    const vadeSonuMevla = parseFloat(task.variables.get('vadeSonuMevla')) || 0;

    const daysToMaturity = task.variables.get('daysToMaturity') || 0;
    const outOfHours = task.variables.get('isOutOfHours') || false;

    const newAccountNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
    const newIban = `TR00999999${newAccountNumber}`;

    const today = new Date();
    const openingDateStr = today.toISOString(); 
    
    const valDate = new Date(today);
    if (outOfHours) {
        valDate.setDate(valDate.getDate() + 1);
    }
    const valueDateStr = valDate.toISOString().split('T')[0];

    let maturityDateStr = null;
    if (receiverAccountType === 'VADELI') {
        const matDate = new Date(valDate);
        matDate.setDate(matDate.getDate() + daysToMaturity);
        maturityDateStr = matDate.toISOString().split('T')[0];
    }

    console.log(`\n🏦 [YENİ HESAP] ${senderId} için ${newAccountNumber} hesap açılıyor. Valör: ${valueDateStr} | Vade Bitiş: ${maturityDateStr || 'Yok'}`);

    db.serialize(() => {
        db.run(`INSERT INTO Accounts (customer_id, account_type, account_number, balance, currency, iban, account_opening_date, value_date, maturity_date, days_to_maturity, maturity_value) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [senderId, receiverAccountType, newAccountNumber, amount, receiverCurrency, newIban, openingDateStr, valueDateStr, maturityDateStr, daysToMaturity, vadeSonuMevla], async (err) => {
            if (!err) {
                io.emit('transfer-approved', { message: 'Yeni hesap açıldı ve bakiye aktarıldı.' });
                await safeComplete(taskService, task);
            } else {
                await safeFailure(taskService, task, "Veritabanı hesap açma hatası: " + err.message);
            }
        });
    });
});

// =======================================================================
// YENİ KURUMSAL MİMARİ: EOD MULTI-INSTANCE (DMN ENTEGRELİ)
// =======================================================================

// 1. GÖREV: SADECE VERİYİ BULUR VE CAMUNDA'YA POSTALAR (SIFIR MATEMATİK)
// 1. GÖREV: SADECE VERİYİ BULUR VE CAMUNDA'YA POSTALAR
// 1. GÖREV: SADECE VERİYİ BULUR VE CAMUNDA'YA POSTALAR
client.subscribe('fetch-matured-accounts', async ({ task, taskService }) => {
    const now = new Date();
    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    console.log(`\n⏳ [GÜN SONU BATCH] Vadesi dolan hesaplar taranıyor... Tarih: ${todayStr}`);

    db.all(`SELECT id, customer_id, account_number, balance, maturity_value, days_to_maturity, customer_type FROM Accounts WHERE account_type = 'VADELI' AND maturity_date = ?`, [todayStr], async (err, accounts) => {
        if (err) return await safeFailure(taskService, task, "Veritabanı okuma hatası");

        const processVariables = new Variables();
        if (accounts && accounts.length > 0) {
            
            // 1. ADIM: SQLite'dan gelen verileri KESİN SAYI (Number) yapıyoruz.
            // 1. ADIM: SQLite'dan gelen verileri KESİN SAYI (Number) ve METİN (String) yapıyoruz.
            const formattedAccounts = accounts.map(acc => ({
                ...acc,
                balance: parseFloat(acc.balance) || 0,
                maturity_value: parseFloat(acc.maturity_value) || 0,
                days_to_maturity: parseInt(acc.days_to_maturity) || 0,
                // HATA ÇÖZÜMÜ: Eğer veritabanında customer_type boş (NULL) kalmışsa, çökmemesi için 'STANDART' varsay.
                customer_type: acc.customer_type || "STANDART" 
            }));

            console.log(`✅ [BATCH BULUNDU] ${formattedAccounts.length} hesap Camunda Multi-Instance motoruna yollanıyor...`);
            
            // 2. ADIM: Camunda Spin eklentisinin döngü kurabilmesi için "Typed JSON" olarak iletiyoruz.
            // Bu sayede .elements() fonksiyonu sorunsuz çalışacak!
            processVariables.setTyped('maturedAccounts', {
                value: JSON.stringify(formattedAccounts),
                type: 'json',
                valueInfo: {}
            });
            processVariables.set('hasMaturedAccounts', true);
        } else {
            console.log(`ℹ️ [BATCH BOŞ] Bugün vadesi dolan hesap bulunamadı.`);
            processVariables.set('hasMaturedAccounts', false);
            // Hata almamak için boş durumu da JSON array olarak gönderiyoruz
            processVariables.setTyped('maturedAccounts', {
                value: '[]',
                type: 'json',
                valueInfo: {}
            }); 
        }

        await safeComplete(taskService, task, processVariables);
    });
});

// 2. GÖREV: CAMUNDA'NIN "ŞU HESABA ŞU FAİZİ YATIR" DEDİĞİ TEKİL İŞLEM KAYDEDİCİSİ
client.subscribe('update-single-account', async ({ task, taskService }) => {
    // Camunda Sub-Process her döngüde bize tek bir 'account' objesi ve DMN'den çıkan 'depositRate'i (Örn: 0.35) verir
    const accountJson = task.variables.get('account'); 
    const account = typeof accountJson === 'string' ? JSON.parse(accountJson) : accountJson;
    
    const depositRate = parseFloat(task.variables.get('depositRate')) || 0; 
    
    const today = new Date();
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    const newStartDateStr = localToday.toISOString().split('T')[0];

    const currentBalance = parseFloat(account.balance) || 0;
    const netInterest = parseFloat(account.maturity_value) || 0;
    
    // 1. Yeni Bakiye = Eski Bakiye + Önceki Dönemden Gelen Net Faiz
    const newBalance = currentBalance + netInterest;
    
    // 2. Yeni Faiz = Yeni Büyümüş Bakiye * Camunda DMN'den Gelen Güncel Oran
    const newMaturityValue = newBalance * depositRate;
    
    // 3. Yeni Vade Tarihi
    const daysToAdd = parseInt(account.days_to_maturity) || 0;
    const nextMaturityDate = new Date(today);
    nextMaturityDate.setDate(nextMaturityDate.getDate() + daysToAdd);
    const newMaturityDateStr = new Date(nextMaturityDate.getTime() - (nextMaturityDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]

    // Güncel verileri doğrudan veritabanına yaz
    db.run(`UPDATE Accounts SET 
        balance = ?, 
        value_date = ?, 
        maturity_date = ?,
        maturity_value = ?
        WHERE id = ?`, [newBalance, newStartDateStr, newMaturityDateStr, newMaturityValue, account.id], async (err) => {
        
        if (!err) {
            console.log(`   -> [DMN ONAYLI TEMDİT] Hesap No: ${account.account_number} | Eski Bakiye: ${currentBalance.toFixed(2)} | Kazanç: ${netInterest.toFixed(2)} | Yeni Bakiye: ${newBalance.toFixed(2)} | DMN Faizi: %${(depositRate * 100).toFixed(1)} | Yeni Hedef Getiri: ${newMaturityValue.toFixed(2)}`);
            await safeComplete(taskService, task);
        } else {
            console.error("Güncelleme hatası:", err.message);
            await safeFailure(taskService, task, "Hesap güncelleme hatası");
        }
    });
});