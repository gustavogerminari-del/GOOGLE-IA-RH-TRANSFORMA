import '../departamento-pessoal/types/dp';
import '../services/JobCandidateService';
import '../headhunter/types';
import './rh';

declare module '../departamento-pessoal/types/dp' {
  interface DadoPessoalColaborador {
    nomeCompleto?: string;
    contatoEmergenciaNome?: string;
    contatoEmergenciaTelefone?: string;
  }

  interface DadoProfissionalColaborador {
    gestor?: string;
    tipoContrato?: TipoContrato;
  }

  interface AnotacaoInternaColaborador {
    authorName?: string;
  }

  interface AfastamentoColaborador {
    tipoAfastamento?: TipoAfastamentoCompleto;
    dataPrevisaoRetorno?: string;
  }

  interface ColaboradorCompleto {
    cpf?: string;
    rg?: string;
    cargo?: string;
    departamento?: string;
    salarioBase?: number;
    dataAdmissao?: string;
    email?: string;
  }
}

declare module '../services/JobCandidateService' {
  interface JobCandidateApplication {
    avatar?: string;
  }
}

declare module '../headhunter/types' {
  interface HeadhunterJob {
    titulo?: string;
    deadline?: string;
  }
}

declare module './rh' {
  interface Job {
    companyName?: string;
  }
}
