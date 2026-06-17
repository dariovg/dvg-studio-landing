/** Estilos responsive para clientes de correo (Gmail móvil, Apple Mail, etc.). */
export function emailResponsiveHeadHtml() {
  return `<style type="text/css">
    @media only screen and (max-width: 600px) {
      .email-outer-pad { padding: 20px 12px !important; }
      .email-inner-pad { padding: 20px 16px !important; }
      .email-header-pad { padding: 24px 16px 12px !important; }
      .email-stack {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      .email-stack-pad { padding: 5px 0 !important; }
      .email-plan-info,
      .email-plan-price {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      .email-plan-price {
        text-align: left !important;
        padding-top: 12px !important;
      }
      .email-plan-price p { text-align: left !important; }
      .email-plan-badge {
        display: inline-block !important;
        margin: 6px 0 0 !important;
      }
      .email-compare-col {
        display: block !important;
        width: 100% !important;
        border-right: none !important;
        border-bottom: 1px solid #e8ecf2 !important;
      }
      .email-compare-col table { border-left: none !important; }
      .email-qr-cell {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        padding: 10px 0 !important;
      }
      .email-qr-cell img { margin: 0 auto !important; }
      .email-qr-link { text-align: center !important; }
      .email-qr-link p { max-width: 100% !important; }
      .email-qr-link a {
        display: block !important;
        width: 100% !important;
        max-width: 280px !important;
        margin: 0 auto !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
      .email-bullets td {
        display: block !important;
        padding: 5px 0 !important;
        font-size: 13px !important;
        line-height: 1.45 !important;
      }
      .email-cta {
        display: block !important;
        width: 100% !important;
        max-width: 320px !important;
        margin: 0 auto !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
      .email-logo { width: 170px !important; max-width: 72vw !important; }
    }
  </style>`;
}
