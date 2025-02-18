using Microsoft.AspNetCore.Mvc;
using DashboardAPI.Data;
using DashboardAPI.Models;
using System.Collections.Generic;
using System.Linq;

namespace DashboardAPI.Controllers
{
    // The DashboardController class is a controller that handles HTTP requests.
    // It adheres to the Single Responsibility Principle (SRP) by focusing on request handling.
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly DashboardContext _context;

        // Constructor that takes a DashboardContext instance and assigns it to a private field.
        // This adheres to the Dependency Inversion Principle (DIP) by depending on abstractions.
        public DashboardController(DashboardContext context)
        {
            _context = context;
        }

        // GET method that returns a list of DashboardModel entities.
        // This adheres to the Open/Closed Principle (OCP) by being open for extension (additional routes) but closed for modification.
        [HttpGet]
        public ActionResult<IEnumerable<DashboardModel>> GetDashboardModels()
        {
            return _context.DashboardItems.ToList();
        }

        // POST method that adds a new DashboardModel entity to the database.
        // This adheres to the Single Responsibility Principle (SRP) by focusing on data manipulation.
        [HttpPost]
        public ActionResult<DashboardModel> Post(DashboardModel dashboardModel)
        {
            _context.DashboardItems.Add(dashboardModel);
            _context.SaveChanges();
            return CreatedAtAction(nameof(GetDashboardModels), new { id = dashboardModel.Id }, dashboardModel);
        }
    }
}
