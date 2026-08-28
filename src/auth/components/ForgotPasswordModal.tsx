import React, { useEffect, useState } from 'react';
import { X, KeyRound, CheckCircle2, TriangleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../../shared';

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, initialEmail = '' }) => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && initialEmail) setEmail(initialEmail.trim().toLowerCase());
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await requestPasswordReset(email);
      setIsSent(true);
    } catch (error: any) {
      const code = String(error?.code || '');
      setErrorMessage(code === 'auth/invalid-email'
        ? 'Informe um e-mail válido.'
        : 'Não foi possível enviar o link agora. Confirme o e-mail e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSent(false);
    setEmail('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
        <button
          type="button"
          onClick={handleReset}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xl font-extrabold text-slate-900">Recuperação de Senha</h3>
        </div>

        {isSent ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">E-mail de Instruções Enviado</h4>
              <p className="text-xs text-slate-500">
                Enviamos um link de redefinição para <strong className="text-slate-800">{email}</strong>. Verifique sua caixa de entrada.
              </p>
            </div>
            <Button variant="primary" onClick={handleReset} className="w-full">
              Entendido e Voltar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Informe seu e-mail corporativo cadastrado para receber o link de redefinição de acesso.
            </p>

            {errorMessage && <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2"><TriangleAlert className="w-4 h-4 shrink-0" />{errorMessage}</div>}

            <Input
              type="email"
              label="E-mail Corporativo"
              placeholder="seu.nome@maisrh.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Enviar Link
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
