import { RegisterNuiCB } from '@project-error/pe-utils';
import { Account } from '@typings/Account';
import {
  AccountEvents,
  ExternalAccountEvents,
  InvoiceEvents,
  SharedAccountEvents,
  TransactionEvents,
  UserEvents,
  BalanceEvents,
  Broadcasts,
  NUIEvents,
  CashEvents,
} from '@typings/Events';
import { Invoice } from '@typings/Invoice';
import { Transaction } from '@typings/Transaction';
import { RegisterNuiProxy } from 'cl_utils';
import API from './cl_api';
import config from './cl_config';

const npwdExports = global.exports['npwd'];

const useFrameworkIntegration = config.frameworkIntegration?.enabled;
let hasNUILoaded = false;

RegisterNuiCB(NUIEvents.Loaded, () => {
  console.debug('NUI has loaded.');
  hasNUILoaded = true;
});

RegisterNuiCB(NUIEvents.Unloaded, () => {
  console.debug('NUI has unloaded.');
  hasNUILoaded = false;
});

const waitForNUILoaded = (checkInterval = 250): Promise<void> => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (hasNUILoaded) {
        resolve();
        clearInterval(interval);
      }
    }, checkInterval);
  });
};

type SendBankUIMessage = {
  app: string;
  method: string;
  data?: unknown;
};
const SendBankUIMessage = (data: SendBankUIMessage) => {
  SendNUIMessage(data);

  if (GetResourceState('npwd') === 'started') {
    //idk how it works in npwd but why not just remapping a value here?
    const payload = { type: data.method, payload: data.data };
    npwdExports.sendUIMessage(payload);
  }
};

onNet(Broadcasts.NewAccount, (payload: Account) => {
  SendBankUIMessage({ app: 'BROADCAST', method: Broadcasts.NewAccount, data: payload });
});

onNet(Broadcasts.NewAccountBalance, (balance: number) => {
  SendBankUIMessage({ app: 'BROADCAST', method: Broadcasts.NewAccountBalance, data: balance });
});

onNet(Broadcasts.NewTransaction, (payload: Transaction) => {
  SendBankUIMessage({ app: 'BROADCAST', method: Broadcasts.NewTransaction, data: payload });
});

onNet(Broadcasts.UpdatedAccount, (payload: Account) => {
  SendBankUIMessage({ app: 'BROADCAST', method: Broadcasts.UpdatedAccount, data: payload });
});

onNet(Broadcasts.NewInvoice, (payload: Invoice) => {
  SendBankUIMessage({ app: 'BROADCAST', method: Broadcasts.NewInvoice, data: payload });
});

onNet(Broadcasts.NewSharedUser, () => {
  SendBankUIMessage({ app: 'BROADCAST', method: Broadcasts.NewSharedUser });
});

onNet(Broadcasts.RemovedSharedUser, () => {
  SendBankUIMessage({ app: 'BROADCAST', method: Broadcasts.RemovedSharedUser });
});

onNet(UserEvents.Loaded, async () => {
  console.debug('Waiting for NUI to load ..');
  await waitForNUILoaded();
  console.debug('Loaded. Emitting data to NUI.');
  SendBankUIMessage({ app: 'USER', method: UserEvents.Loaded, data: true });

  if (!useFrameworkIntegration) {
    StatSetInt(CASH_BAL_STAT, (await API.getMyCash()) ?? 0, true);
  }
});

onNet(UserEvents.Unloaded, () => {
  SendBankUIMessage({ app: 'USER', method: UserEvents.Unloaded });
});

const CASH_BAL_STAT = GetHashKey('MP0_WALLET_BALANCE');
onNet(BalanceEvents.UpdateCashBalance, (newBalance: number) => {
  StatSetInt(CASH_BAL_STAT, newBalance, true);
});

RegisterNuiProxy(AccountEvents.GetAccounts);
RegisterNuiProxy(AccountEvents.CreateAccount);
RegisterNuiProxy(AccountEvents.DeleteAccount);
RegisterNuiProxy(AccountEvents.SetDefaultAccount);
RegisterNuiProxy(AccountEvents.RenameAccount);
RegisterNuiProxy(InvoiceEvents.Get);
RegisterNuiProxy(InvoiceEvents.CountUnpaid);
RegisterNuiProxy(InvoiceEvents.CreateInvoice);
RegisterNuiProxy(InvoiceEvents.PayInvoice);
RegisterNuiProxy(TransactionEvents.Get);
RegisterNuiProxy(TransactionEvents.GetHistory);
RegisterNuiProxy(TransactionEvents.CreateTransfer);

RegisterNuiProxy(UserEvents.GetUsers);
RegisterNuiProxy(SharedAccountEvents.AddUser);
RegisterNuiProxy(SharedAccountEvents.RemoveUser);
RegisterNuiProxy(SharedAccountEvents.GetUsers);
RegisterNuiProxy(ExternalAccountEvents.Add);
RegisterNuiProxy(ExternalAccountEvents.Get);

RegisterNuiProxy(AccountEvents.WithdrawMoney);
RegisterNuiProxy(AccountEvents.DepositMoney);
RegisterNuiProxy(CashEvents.GetMyCash);

RegisterCommand(
  'bank-force-load',
  async () => {
    console.debug('Waiting for NUI to load ..');
    await waitForNUILoaded();
    console.debug('Loaded. Emitting data to NUI.');
    SendBankUIMessage({ app: 'USER', method: UserEvents.Loaded, data: true });
  },
  false,
);
