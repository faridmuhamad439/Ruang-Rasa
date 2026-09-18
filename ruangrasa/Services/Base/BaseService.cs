using System;
using ruangrasa.Services.Context;

namespace ruangrasa.Services.Base
{
    public class BaseService
    {
        private RuangrasaDbContext _context;

        public RuangrasaDbContext context
        {
            get
            {
                if (_context == null)
                {
                    _context = new RuangrasaDbContext();
                }
                return _context;
            }
            set
            {
                _context = value;
            }
        }

        public BaseService()
        {
            _context = new RuangrasaDbContext();
        }

        public void RefreshContext()
        {
            try
            {
                _context?.Dispose();
            }
            catch {}
            _context = new RuangrasaDbContext();
        }
    }
}
