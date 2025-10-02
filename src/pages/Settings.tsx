import React from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon } from 'lucide-react';
import { useGradientTheme } from '@/context/GradientThemeContext';
import { useCurrency, currencies, CurrencyCode } from '@/context/CurrencyContext';
import { useAppModule } from '@/context/AppModuleContext';

const Settings = () => {
  const { currentGradientTheme, setGradientTheme } = useGradientTheme();
  const { selectedCurrency, setSelectedCurrencyCode } = useCurrency();
  const { activeModule } = useAppModule();

  return (
    <MainLayout module={activeModule}>
      <div className="space-y-6 mt-6">

        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
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
    </MainLayout>
  );
};

export default Settings;