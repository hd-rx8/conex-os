import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Building2, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useGradientTheme } from '@/context/GradientThemeContext';
import { useCurrency, currencies, CurrencyCode } from '@/context/CurrencyContext';
import { useAppModule } from '@/context/AppModuleContext';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ─── Seção: Dados da Empresa ─────────────────────────────────────────────────

const CompanySettingsSection = () => {
  const { companySettings, isLoading, saveCompanySettings } = useCompanySettings();
  const [form, setForm] = useState({
    company_name: '',
    cnpj: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    logo_url: '',
  });

  // Preenche o form quando os dados carregam do banco
  useEffect(() => {
    if (companySettings) {
      setForm({
        company_name: companySettings.company_name ?? '',
        cnpj: companySettings.cnpj ?? '',
        phone: companySettings.phone ?? '',
        email: companySettings.email ?? '',
        website: companySettings.website ?? '',
        address: companySettings.address ?? '',
        city: companySettings.city ?? '',
        state: companySettings.state ?? '',
        zip_code: companySettings.zip_code ?? '',
        logo_url: companySettings.logo_url ?? '',
      });
    }
  }, [companySettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    saveCompanySettings.mutate({
      company_name: form.company_name || null,
      cnpj: form.cnpj || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      zip_code: form.zip_code || null,
      logo_url: form.logo_url || null,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>Dados da Empresa</CardTitle>
        </div>
        <CardDescription>
          Essas informações aparecem nas suas propostas comerciais geradas pelo sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Identificação */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identificação</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                name="company_name"
                placeholder="Ex: Conex Soluções Ltda."
                value={form.company_name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                name="cnpj"
                placeholder="00.000.000/0000-00"
                value={form.cnpj}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Contato */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contato</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Comercial</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="contato@empresa.com.br"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="(00) 00000-0000"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Site</Label>
              <Input
                id="website"
                name="website"
                placeholder="https://www.empresa.com.br"
                value={form.website}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Endereço */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Endereço</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="address">Logradouro</Label>
              <Input
                id="address"
                name="address"
                placeholder="Rua, número, complemento"
                value={form.address}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                name="city"
                placeholder="São Paulo"
                value={form.city}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado (UF)</Label>
              <Input
                id="state"
                name="state"
                placeholder="SP"
                maxLength={2}
                className="uppercase"
                value={form.state}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                name="zip_code"
                placeholder="00000-000"
                value={form.zip_code}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saveCompanySettings.isPending}
          >
            {saveCompanySettings.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
            ) : (
              'Salvar dados da empresa'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Seção: Segurança ─────────────────────────────────────────────────────────

const SecuritySection = () => {
  const { user } = useSession();
  const { toast } = useToast();
  const [emailForm, setEmailForm] = useState({ newEmail: '', confirmEmail: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleEmailChange = async () => {
    if (!emailForm.newEmail || !emailForm.confirmEmail) {
      toast({ title: 'Preencha ambos os campos de e-mail.', variant: 'destructive' });
      return;
    }
    if (emailForm.newEmail !== emailForm.confirmEmail) {
      toast({ title: 'Os e-mails não coincidem.', variant: 'destructive' });
      return;
    }
    if (emailForm.newEmail === user?.email) {
      toast({ title: 'O novo e-mail é igual ao atual.', variant: 'destructive' });
      return;
    }

    setLoadingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: emailForm.newEmail });
    setLoadingEmail(false);

    if (error) {
      toast({ title: 'Erro ao atualizar e-mail', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Confirmação enviada!',
        description: `Um link de confirmação foi enviado para ${emailForm.newEmail}. Verifique sua caixa de entrada.`,
      });
      setEmailForm({ newEmail: '', confirmEmail: '' });
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({ title: 'Preencha ambos os campos de senha.', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: 'A senha deve ter no mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }

    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
    setLoadingPassword(false);

    if (error) {
      toast({ title: 'Erro ao atualizar senha', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Senha alterada com sucesso!' });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <CardTitle>Segurança</CardTitle>
        </div>
        <CardDescription>
          Gerencie o e-mail e a senha da sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">

        {/* Alterar E-mail */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Alterar E-mail</h4>
          <p className="text-sm text-muted-foreground">
            E-mail atual: <span className="font-medium text-foreground">{user?.email}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">Novo e-mail</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="novo@email.com"
                value={emailForm.newEmail}
                onChange={e => setEmailForm(p => ({ ...p, newEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmEmail">Confirmar novo e-mail</Label>
              <Input
                id="confirmEmail"
                type="email"
                placeholder="novo@email.com"
                value={emailForm.confirmEmail}
                onChange={e => setEmailForm(p => ({ ...p, confirmEmail: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleEmailChange} disabled={loadingEmail}>
              {loadingEmail ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : 'Alterar e-mail'}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Alterar Senha */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Alterar Senha</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handlePasswordChange} disabled={loadingPassword}>
              {loadingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Alterar senha'}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────

const Settings = () => {
  const { currentGradientTheme, setGradientTheme } = useGradientTheme();
  const { selectedCurrency, setSelectedCurrencyCode } = useCurrency();
  const { activeModule } = useAppModule();

  return (
    <MainLayout module={activeModule}>
      <div className="space-y-6 mt-6">

        {/* Aparência */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <CardTitle>Aparência</CardTitle>
            </div>
            <CardDescription>Personalize a aparência da aplicação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Modo (Claro/Escuro)</p>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Tema de Gradiente</p>
              <Select
                value={currentGradientTheme}
                onValueChange={(value) => setGradientTheme(value as 'conexhub' | 'alt1' | 'alt2')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecionar tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conexhub">Andromeda</SelectItem>
                  <SelectItem value="alt1">Nebula</SelectItem>
                  <SelectItem value="alt2">Quasar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Preferências Regionais */}
        <Card>
          <CardHeader>
            <CardTitle>Preferências Regionais</CardTitle>
            <CardDescription>Ajuste as configurações de moeda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Moeda Padrão</p>
              <Select
                value={selectedCurrency.code}
                onValueChange={(value) => setSelectedCurrencyCode(value as CurrencyCode)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecionar moeda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dados da Empresa */}
        <CompanySettingsSection />

        {/* Segurança */}
        <SecuritySection />

      </div>
    </MainLayout>
  );
};

export default Settings;