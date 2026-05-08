import type { PrivacyPolicyPageContent } from '@/types/sitePublicContent';

/**
 * Texto por omissão da página `/privacidade` e referência para seeds.
 * Marcadores: **negrito**, listas com `- `, parágrafos separados por linha em branco; `{{dominioSite}}`, `{{emailContato}}`.
 */
export const DEFAULT_PRIVACY_POLICY_PAGE_CONTENT: PrivacyPolicyPageContent = {
  eyebrow: 'Lancurie · Transparência',
  title: 'Política de privacidade',
  lastUpdatedLine: 'Última atualização: 8 de maio de 2026',
  backLinkLabel: 'Voltar ao início',
  sections: [
    {
      title: '1. Objetivo',
      body:
        'Esta política descreve como o site {{dominioSite}} trata dados pessoais quando você navega nas páginas públicas. O foco é ser transparente sobre as métricas de uso e sobre os dados de localização aproximada utilizados apenas para estatísticas e melhoria contínua do site — não vendemos dados nem fazemos perfilagem publicitária com essas informações.',
    },
    {
      title: '2. Responsável pelo tratamento',
      body:
        'Responsável: Lancurie Technology (site {{dominioSite}}). Para exercer direitos ou tirar dúvidas sobre privacidade, você pode contactar-nos em {{emailContato}}.',
    },
    {
      title: '3. O que tratamos se você aceitar métricas',
      body: `Somente depois que você clica em Aceitar no aviso de cookies e métricas, podemos registar, no máximo uma visita sua por dia (por página relevante), incluindo:

- Identificador técnico aleatório gerado no seu navegador (não é o seu nome nem e-mail), para distinguir visitantes sem obrigar login;
- Endereço da página visitada (caminho da URL interna ao site);
- Data do acesso (dia no fuso de referência do sistema), para contagem diária;
- Localização aproximada: obtida em geral por estimativa a partir do IP (serviços terceiros de geo por IP) ou, quando o navegador permitir e você tiver concedido permissão de geolocalização, coordenadas aproximadas. Podem vir associados país, região ou cidade quando esses serviços devolvem esses campos.

Se você escolher Recusar, esse registo de métricas não é feito para fins estatísticos descritos acima.`,
    },
    {
      title: '4. Armazenamento no seu dispositivo',
      body: `O navegador pode guardar localmente, conforme necessário ao funcionamento:

- Preferência de consentimento (aceitar ou recusar métricas);
- Identificador técnico da métrica (quando aceito);
- Cache temporário da localização estimada no mesmo dia (para reduzir pedidos repetidos à rede);
- Dados de sessão (por exemplo, evitar duplicar o mesmo envio em poucos segundos ao mudar de vista na aplicação).

Não utilizamos esses dados para formulários de contacto nem para criar conta neste fluxo — apenas para métricas internas quando há consentimento.`,
    },
    {
      title: '5. Onde os registos ficam guardados',
      body:
        'Os registos de visita (incluindo dados descritos na secção 3, quando aplicável) são armazenados na infraestrutura Firebase / Firestore (Google Cloud), utilizada como serviço de base de dados pela Lancurie. Pedidos de localização por IP podem envolver operadores terceiros (por exemplo, serviços que devolvem cidade ou país a partir do IP); esses fornecedores tratam dados segundo as próprias políticas e apenas na medida necessária para devolver a estimativa de geo.',
    },
    {
      title: '6. Finalidade e base legal',
      body: `Finalidade: medir audiência de forma agregada, compreender origem geográfica aproximada dos acessos e melhorar conteúdo, performance e experiência do site.

Base legal: consentimento, manifestado pelo botão Aceitar no aviso. Você pode retirar ou rever o consentimento a qualquer momento usando Gerenciar cookies no rodapé (isso remove a preferência gravada e o aviso pode voltar a ser exibido).`,
    },
    {
      title: '7. Prazo de conservação',
      body:
        'Mantemos os registos de métricas pelo tempo necessário para análise estatística e histórico operacional da Lancurie, observando a capacidade técnica da base e boas práticas de minimização. Identificadores locais no navegador podem ser apagados por você nas definições do próprio navegador ou ao limpar dados do site.',
    },
    {
      title: '8. Seus direitos (LGPD)',
      body:
        'Nos termos da legislação brasileira aplicável, você pode solicitar confirmação de tratamento, acesso, correção, anonimização, eliminação de dados desnecessários, portabilidade quando cabível, informação sobre compartilhamentos e revogação do consentimento. Para isso, utilize o e-mail indicado na secção 2. Responderemos no prazo legal.',
    },
    {
      title: '9. Alterações',
      body:
        'Podemos atualizar esta política quando o site ou as ferramentas de medição mudarem. A data no topo desta página indica a última revisão relevante.',
    },
  ],
};
