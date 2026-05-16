class SRIConexionError(Exception):
    """Error de comunicacion con servicios SRI."""


class SRIRechazoError(Exception):
    """Comprobante rechazado por SRI."""


class FirmaError(Exception):
    """Error de firma electronica."""


class StockInsuficienteError(Exception):
    """Stock insuficiente para completar la operacion."""


class SRIValidacionError(Exception):
    """Error de validacion normativa SRI antes de envio."""
