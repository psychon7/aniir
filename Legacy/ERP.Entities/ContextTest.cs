using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Xml.Serialization;

namespace ERP.Entities
{

    [XmlRoot("Context")]
    public class ContextTest
    {
        public ContextTest() { this.Persons = new Persons(); }

        [XmlArray("Persons")]
        [XmlArrayItem("Person")]
        public Persons Persons { get; set; }
    }

    public class Persons : List<Human> { }

    public class Human
    {
        public Human() { }
        public Human(string name) { Name = name; }
        public string Name { get; set; }
    }

    class Program
    {
        public static void Main(string[] args)
        {
            ContextTest ctx = new ContextTest();
            ctx.Persons.Add(new Human("john"));
            ctx.Persons.Add(new Human("jane"));

            var writer = new StringWriter();
            new XmlSerializer(typeof(ContextTest)).Serialize(writer, ctx);

            Console.WriteLine(writer.ToString());
        }
    }
}
