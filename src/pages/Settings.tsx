import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon } from 'lucide-react';
import PageHeader from '@/components/PageHeader'; 
import { useGradientTheme } from '@/context/GradientThemeContext';
import { useCurrency, currencies, CurrencyCode } from '@/context/CurrencyContext'; // Import currency context and types

const Settings = () => {
  const { currentGradientTheme, setGradientTheme } = useGradientTheme();
  const { selectedCurrency, setSelectedCurrencyCode } = useCurrency(); // Use currency context

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Configurações"
          subtitle="Ajuste as configurações da sua conta e do aplicativo"
          icon={SettingsIcon}
        />

        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Personalize a aparência da aplicação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Tema (Claro/Escuro)</p>
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
                  <SelectItem value="conexhub">CONEX.HUB Padrão</SelectItem>
                  <SelectItem value="alt1">Alternativo 1</SelectItem>
                  <SelectItem value="alt2">Alternativo 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </Layout>
  );
};

export default Settings;