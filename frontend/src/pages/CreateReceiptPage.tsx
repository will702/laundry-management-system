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
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Employee, Client } from '@mass-laundry/shared-types';
import { ClientSelector } from '@/features/clients/ClientSelector';
import { ReceiptForm }    from '@/features/receipts/ReceiptForm';
import { Button, Card, PageHeader } from '@/components/ui';
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
    <div className="page-container bg-surface-sunken py-6">
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
            <PageHeader title="Bon baru" description="Pilih pelanggan, lalu ketuk layanan untuk mengisi bon." />
            <Card>
              <ClientSelector
                onClientSelect={setSelectedClient}
                selectedClient={null}
              />
            </Card>
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
            <PageHeader title="Bon baru" />
            {/* Customer strip: who this bon is for, with a way back */}
            <div className="mb-6 flex items-center justify-between gap-3 border-y border-border py-2">
              <p className="min-w-0 truncate text-base text-ink-muted">
                Bon untuk <span className="font-semibold text-ink">{selectedClient.name}</span>
                <span className="stamp ml-3">{selectedClient.phone}</span>
              </p>
              <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)} icon={<ArrowLeft size={16} />} className="shrink-0">
                Ganti pelanggan
              </Button>
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
