/**
 * CreateReceiptPage — the hot-path receipt creation flow.
 *
 * Step 1: Select or create a client (ClientSelector)
 * Step 2: Fill in receipt items (ReceiptForm)
 *
 * Uses router-aware state so back-navigation goes to the client step,
 * and after a receipt is created the user is navigated to /receipts.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Employee, Client } from '@mass-laundry/shared-types';
import { ClientSelector } from '@/features/clients/ClientSelector';
import { ReceiptForm }    from '@/features/receipts/ReceiptForm';
import { Button }         from '@/components/ui/Button';
import { fadeUp }         from '@/lib/motion';

interface Props {
  employee: Employee;
}

export function CreateReceiptPage({ employee }: Props) {
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleReceiptCreated = (_receiptId: string) => {
    setSelectedClient(null);
    navigate('/receipts');
  };

  return (
    <div className="page-container">
      <AnimatePresence mode="wait" initial={false}>
        {!selectedClient ? (
          /* ── Step 1: Client selection ────────────────────────────── */
          <motion.div
            key="client-select"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-ink tracking-tight">Bon Baru</h1>
              <p className="text-sm text-ink-muted mt-0.5">Pilih atau tambah pelanggan untuk mulai</p>
            </div>
            <div className="bg-surface rounded-xl border border-border shadow-xs p-4 md:p-6">
              <ClientSelector
                onClientSelect={setSelectedClient}
                selectedClient={null}
              />
            </div>
          </motion.div>
        ) : (
          /* ── Step 2: Receipt form ──────────────────────────────────── */
          <motion.div
            key="receipt-form"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {/* Breadcrumb / back nav */}
            <div className="flex items-center gap-3 mb-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedClient(null)}
                icon={<ArrowLeft size={14} />}
                className="px-2.5"
              >
                Pilih Ulang
              </Button>
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <UserCircle size={15} className="text-brand-500" />
                <span>
                  Bon untuk{' '}
                  <span className="font-semibold text-ink">{selectedClient.name}</span>
                </span>
              </div>
            </div>

            <ReceiptForm
              employee={employee}
              client={selectedClient}
              onReceiptCreated={handleReceiptCreated}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
