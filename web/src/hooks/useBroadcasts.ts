import { accountsAtom } from '@data/accounts';
import { invoicesAtom } from '@data/invoices';
import { transactionBaseAtom } from '@data/transactions';
import { Account } from '@typings/Account';
import { Broadcasts } from '@typings/Events';
import { updateAccount } from '@utils/account';
import { useAtom, useSetAtom } from 'jotai';
import { useNuiEvent } from 'fivem-nui-react-lib';

export const useBroadcasts = () => {
  const updateInvoices = useSetAtom(invoicesAtom);
  const updateTransactions = useSetAtom(transactionBaseAtom);
  const [accounts, updateAccounts] = useAtom(accountsAtom);

  useNuiEvent('BROADCAST', Broadcasts.NewTransaction, () => {
    updateTransactions();
  });

  useNuiEvent('BROADCAST', Broadcasts.NewAccount, (account: Account) => {
    updateAccounts([...accounts, account]);
  });

  useNuiEvent('BROADCAST', Broadcasts.UpdatedAccount, () => {
    updateAccounts();
  });

  useNuiEvent('BROADCAST', Broadcasts.NewAccountBalance, (account: Account) => {
    updateAccounts(updateAccount(accounts, account));
  });

  useNuiEvent('BROADCAST', Broadcasts.NewInvoice, () => {
    updateInvoices();
  });

  useNuiEvent('BROADCAST', Broadcasts.NewSharedUser, () => {
    updateAccounts();
  });

  useNuiEvent('BROADCAST', Broadcasts.RemovedSharedUser, () => {
    updateAccounts();
  });
};

export const BroadcastsWrapper = () => {
  useBroadcasts();
  return null;
};
