-- Allow funds reserved for a campaign to be released back to the advertiser.
-- Refund workflows must write the refund credit and reserve_release entry
-- atomically, with matching user, campaign, currency, and amount.
ALTER TABLE ledger_entries
  DROP CONSTRAINT IF EXISTS ledger_entries_entry_type_check;

ALTER TABLE ledger_entries
  ADD CONSTRAINT ledger_entries_entry_type_check
  CHECK (entry_type IN (
    'deposit',
    'reserve',
    'reserve_release',
    'delivery_charge',
    'earning',
    'fee',
    'refund',
    'withdrawal'
  ));
