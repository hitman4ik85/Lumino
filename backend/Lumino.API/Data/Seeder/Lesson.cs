using System.Text.Json;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Domain.Enums;

namespace Lumino.Api.Data.Seeder
{
    public static class LessonSeederData
    {
        public static List<CourseSeed> GetCourses()
        {
            return new List<CourseSeed>
            {
                new CourseSeed("English A1", "Basics: greetings, numbers, travel, simple phrases", "en", true, "A1", 1),
                new CourseSeed("English A2", "Elementary: daily life, shopping, simple dialogs", "en", true, "A2", 2),
                new CourseSeed("English B1", "Intermediate: work, travel, opinions, longer texts", "en", true, "B1", 3),
                new CourseSeed("English B2", "Upper-intermediate: complex topics, fluency practice", "en", true, "B2", 4),
                new CourseSeed("English C1", "Advanced: academic and professional communication", "en", true, "C1", 5)
            };
        }

        public static List<Scene> GetScenes()
        {
            var scenes = new List<Scene>
                        {
                            new Scene
                            {
                                Title = "Cafe order",
                                Description = "Order a coffee in a cafe",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 1
                            },
                            new Scene
                            {
                                Title = "Airport check-in",
                                Description = "Check in for your flight",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 2
                            },
                            new Scene
                            {
                                Title = "Hotel booking",
                                Description = "Book a room at a hotel reception",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 3
                            },
                            new Scene
                            {
                                Title = "Asking directions",
                                Description = "Ask how to get to a place in the city",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 4
                            },
                            new Scene
                            {
                                Title = "Shopping",
                                Description = "Buy something in a store and ask the price",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 5
                            },
                            new Scene
                            {
                                Title = "Small talk",
                                Description = "Introduce yourself and keep a short conversation",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 6
                            },
                            new Scene
                            {
                                Title = "Restaurant reservation",
                                Description = "Reserve a table at a restaurant",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 7
                            },
                            new Scene
                            {
                                Title = "Doctor visit",
                                Description = "Describe your symptoms at a doctor",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 8
                            },
                            new Scene
                            {
                                Title = "Public transport",
                                Description = "Buy a ticket and ask about the bus",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 9
                            },
                            new Scene
                            {
                                Title = "Job interview",
                                Description = "Answer basic questions in an interview",
                                SceneType = "Dialog",
                                BackgroundUrl = null,
                                AudioUrl = null,
                                Order = 10
                            }
                        };

            return scenes;
        }

        public static Dictionary<string, List<SceneStepSeed>> GetSceneStepsBySceneTitle()
        {
            var stepsBySceneTitle = new Dictionary<string, List<SceneStepSeed>>(StringComparer.OrdinalIgnoreCase)
            {
                ["Cafe order"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Barista", "Hi! What would you like?", "Line", null, null),
                                new SceneStepSeed(2, "You", "I'd like a coffee, please.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "What did you order?", "Choice", null, "[{\"text\": \"Coffee\", \"isCorrect\": true}, {\"text\": \"Tea\", \"isCorrect\": false}, {\"text\": \"Water\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Barista", "Sure. Anything else?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Do you want anything else?", "Choice", null, "[{\"text\": \"No\", \"isCorrect\": true}, {\"text\": \"Yes\", \"isCorrect\": false}]"),
                                new SceneStepSeed(6, "Quiz", "Type: Thank you", "Input", null, "{\"correctAnswer\": \"Thank you\", \"acceptableAnswers\": [\"Thanks\", \"Thanks!\"]}")
                            },
                ["Airport check-in"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Staff", "Hello. Can I see your passport?", "Line", null, null),
                                new SceneStepSeed(2, "You", "Yes, here you go.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "Type the key word: passport", "Input", null, "{\"correctAnswer\": \"passport\", \"acceptableAnswers\": [\"my passport\"]}"),
                                new SceneStepSeed(4, "Staff", "Do you have any luggage?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "How many bags do you have?", "Choice", null, "[{\"text\": \"One small bag\", \"isCorrect\": true}, {\"text\": \"Three suitcases\", \"isCorrect\": false}, {\"text\": \"None\", \"isCorrect\": false}]"),
                                new SceneStepSeed(6, "You", "Just a small bag.", "Line", null, null)
                            },
                ["Hotel booking"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Receptionist", "Hello! Do you have a reservation?", "Line", null, null),
                                new SceneStepSeed(2, "Quiz", "What does \"reservation\" mean here?", "Choice", null, "[{\"text\": \"Booking\", \"isCorrect\": true}, {\"text\": \"Restaurant\", \"isCorrect\": false}, {\"text\": \"Passport\", \"isCorrect\": false}]"),
                                new SceneStepSeed(3, "You", "Yes, it's under my name.", "Line", null, null),
                                new SceneStepSeed(4, "Quiz", "Type: key", "Input", null, "{\"correctAnswer\": \"key\", \"acceptableAnswers\": [\"room key\"]}"),
                                new SceneStepSeed(5, "Receptionist", "Great. Here is your key.", "Line", null, null),
                                new SceneStepSeed(6, "You", "Thank you!", "Line", null, null)
                            },
                ["Asking directions"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "You", "Excuse me, where is the station?", "Line", null, null),
                                new SceneStepSeed(2, "Quiz", "Where do you want to go?", "Choice", null, "[{\"text\": \"To the station\", \"isCorrect\": true}, {\"text\": \"To the hotel\", \"isCorrect\": false}, {\"text\": \"To the airport\", \"isCorrect\": false}]"),
                                new SceneStepSeed(3, "Person", "Go straight and turn left.", "Line", null, null),
                                new SceneStepSeed(4, "Quiz", "Type: left", "Input", null, "{\"correctAnswer\": \"left\", \"acceptableAnswers\": [\"turn left\"]}"),
                                new SceneStepSeed(5, "You", "Thanks a lot!", "Line", null, null),
                                new SceneStepSeed(6, "Person", "You're welcome.", "Line", null, null)
                            },
                ["Shopping"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "You", "How much is this?", "Line", null, null),
                                new SceneStepSeed(2, "Seller", "It's ten dollars.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "How much is it?", "Choice", null, "[{\"text\": \"Ten dollars\", \"isCorrect\": true}, {\"text\": \"Five dollars\", \"isCorrect\": false}, {\"text\": \"Twenty dollars\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "You", "That's cheap! I'll take it.", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Type: I'll take it", "Input", null, "{\"correctAnswer\": \"I'll take it\", \"acceptableAnswers\": [\"I will take it\"]}"),
                                new SceneStepSeed(6, "Seller", "Great choice!", "Line", null, null)
                            },
                ["Small talk"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "You", "Hi! My name is Alex.", "Line", null, null),
                                new SceneStepSeed(2, "Person", "Nice to meet you, Alex!", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "What is your name?", "Choice", null, "[{\"text\": \"Alex\", \"isCorrect\": true}, {\"text\": \"John\", \"isCorrect\": false}, {\"text\": \"Kate\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Quiz", "Type: Nice to meet you", "Input", null, "{\"correctAnswer\": \"Nice to meet you\", \"acceptableAnswers\": [\"Nice to meet you!\"]}"),
                                new SceneStepSeed(5, "You", "Nice to meet you too.", "Line", null, null),
                                new SceneStepSeed(6, "Person", "How are you?", "Line", null, null)
                            },
                ["Restaurant reservation"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Host", "Hello! Do you have a reservation?", "Line", null, null),
                                new SceneStepSeed(2, "You", "Yes, a table for two, please.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "How many people?", "Choice", null, "[{\"text\": \"Two\", \"isCorrect\": true}, {\"text\": \"Five\", \"isCorrect\": false}, {\"text\": \"One\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Host", "Great. What time would you like?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Type: at seven", "Input", null, "{\"correctAnswer\": \"at seven\", \"acceptableAnswers\": [\"7 pm\", \"at 7\"]}"),
                                new SceneStepSeed(6, "You", "At seven, thank you.", "Line", null, null)
                            },
                ["Doctor visit"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Doctor", "Hello. What seems to be the problem?", "Line", null, null),
                                new SceneStepSeed(2, "You", "I have a headache.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "What do you have?", "Choice", null, "[{\"text\": \"A headache\", \"isCorrect\": true}, {\"text\": \"A ticket\", \"isCorrect\": false}, {\"text\": \"A coffee\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Doctor", "How long have you had it?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Type: two days", "Input", null, "{\"correctAnswer\": \"two days\", \"acceptableAnswers\": [\"2 days\", \"for two days\"]}"),
                                new SceneStepSeed(6, "Doctor", "Ok. Please rest and drink water.", "Line", null, null)
                            },
                ["Public transport"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "You", "Excuse me, where can I buy a ticket?", "Line", null, null),
                                new SceneStepSeed(2, "Staff", "You can buy it here.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "Where can you buy a ticket?", "Choice", null, "[{\"text\": \"Here\", \"isCorrect\": true}, {\"text\": \"At the hotel\", \"isCorrect\": false}, {\"text\": \"At the cafe\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Staff", "One-way or return?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Type: one-way", "Input", null, "{\"correctAnswer\": \"one-way\", \"acceptableAnswers\": [\"one way\"]}"),
                                new SceneStepSeed(6, "You", "One-way, please.", "Line", null, null)
                            },
                ["Job interview"] = new List<SceneStepSeed>
                            {
                                new SceneStepSeed(1, "Interviewer", "Welcome. Can you tell me about yourself?", "Line", null, null),
                                new SceneStepSeed(2, "You", "I'm a student and I like learning languages.", "Line", null, null),
                                new SceneStepSeed(3, "Quiz", "Who are you?", "Choice", null, "[{\"text\": \"A student\", \"isCorrect\": true}, {\"text\": \"A pilot\", \"isCorrect\": false}, {\"text\": \"A doctor\", \"isCorrect\": false}]"),
                                new SceneStepSeed(4, "Interviewer", "Why do you want this job?", "Line", null, null),
                                new SceneStepSeed(5, "Quiz", "Type: I want to grow", "Input", null, "{\"correctAnswer\": \"I want to grow\", \"acceptableAnswers\": [\"I want to improve\", \"I want to learn\"]}"),
                                new SceneStepSeed(6, "Interviewer", "Great. Thank you for coming.", "Line", null, null)
                            }
            };

            return stepsBySceneTitle;
        }

        public static List<TopicSeed> GetTopics()
        {
            var topics = new List<TopicSeed>
                        {
                            new TopicSeed("Basic words", 1),
                            new TopicSeed("Simple sentences", 2),
                            new TopicSeed("Travel", 3),
                            new TopicSeed("Food & Cafe", 4),
                            new TopicSeed("Family & Friends", 5),
                            new TopicSeed("Home", 6),
                            new TopicSeed("Daily Routine", 7),
                            new TopicSeed("Shopping & Clothes", 8),
                            new TopicSeed("Weather & Seasons", 9),
                            new TopicSeed("Health & Body", 10),
                        };

            return topics;
        }

        public static List<LessonSeed> GetLessons(Dictionary<string, Topic> topicMap)
        {
            var lessons = new List<LessonSeed>
                        {
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 1",
                                "sister = сестра\nbook = книжка\ntable = стіл\nmother = мама\napple = яблуко\nhouse = будинок\npen = ручка\nsun = сонце\nzoo = зоопарк\nfriend = друг\ncat = кіт\nhat = шапка\nchair = стілець\nteacher = вчитель\ndog = собака\nschool = школа\nmilk = молоко", 1),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 2",
                                "red = червоний\nwater = вода\nbread = хліб\nopen = відкривати\nstory = історія\nwindow = вікно\ndoor = двері\nbed = ліжко\ncup = чашка\nbird = птах\nfish = риба\nplay = грати", 2),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 3",
                                "floor = підлога\nwall = стіна\nplate = тарілка\nspoon = ложка\nfork = виделка\nbag = сумка\nbox = коробка\nphone = телефон\nkey = ключ", 3),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 4",
                                "bus = автобус\ncar = машина\nbike = велосипед\ntrain = поїзд", 4),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 5",
                                "run = бігати\neat = їсти\ndrink = пити\nsleep = спати\nread = читати\nwrite = писати\nclose = закривати\nwalk = йти\nsit = сидіти\nstand = стояти\nlook = дивитися", 5),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 6",
                                "happy = щасливий\nbig = великий\nsmall = малий\nhot = гарячий\ncold = холодний\ngood = добрий\nbad = поганий\nnew = новий\nold = старий\ntired = втомлений\nsad = сумний\nangry = злий", 6),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 7",
                                "on = на\nin = в\nunder = під\nnear = біля\nhere = тут\nthere = там\nleft = ліворуч\nright = праворуч\nabove = над\nbelow = під\ninside = всередині\noutside = ззовні", 7),
                            new LessonSeed(topicMap["Basic words"].Id, "Lesson 8",
                                "wake up = прокидатися\ngo = йти\ncome = приходити\nwork = працювати\nmorning = ранок\nday = день\nevening = вечір\nnight = ніч", 8),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Present Simple: I / you",
                                "У цьому уроці немає нових слів", 1),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Present Simple: he / she",
                                "drinks = п’є\neats = їсть\nreads = читає\nplays = грає\nruns = біжить\nworks = працює\nsleeps = спить\ngoes = йде\ncomes = приходить", 2),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Negative: I / you — don’t",
                                "don’t = не (скорочення від do not)", 3),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Negative: he / she — doesn’t",
                                "doesn’t = не (скорочення від does not)", 4),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Questions: Do you…?",
                                "do = допоміжне дієслово (для питань)", 5),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Short answers: Yes / No",
                                "У цьому уроці немає нових слів", 6),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Questions: Does he / she…?",
                                "does = допоміжне дієслово (для питань з he/she/it)", 7),
                            new LessonSeed(topicMap["Simple sentences"].Id, "Short answers: he / she",
                                "У цьому уроці немає нових слів", 8),
                            new LessonSeed(topicMap["Travel"].Id, "At the airport",
                                "Airport = Аеропорт\nTicket = Квиток\nPassport = Паспорт\nGate = Вихід на посадку\nBoarding pass = Посадковий талон\nFlight = Рейс\nCheck-in = Реєстрація\nLuggage = Багаж", 1),
                            new LessonSeed(topicMap["Travel"].Id, "Asking directions",
                                "Where = Де\nLeft = Ліворуч\nRight = Праворуч\nGo = Йти\nMap = Карта\nStreet = Вулиця\nCorner = Ріг\nCity center = Центр міста", 2),
                            new LessonSeed(topicMap["Travel"].Id, "Hotel check-in",
                                "Hotel = Готель\nReservation = Бронювання\nReception = Рецепція\nRoom = Номер\nSingle room = Одномісний номер\nDouble room = Двомісний номер\nKey card = Картка-ключ\nCheck in = Заселятися", 3),
                            new LessonSeed(topicMap["Travel"].Id, "Public transport",
                                "Bus stop = Автобусна зупинка\nTrain station = Залізничний вокзал\nPlatform = Платформа\nTaxi = Таксі\nOne-way ticket = Квиток в один бік\nReturn ticket = Квиток назад\nDepartures = Відправлення\nArrivals = Прибуття", 4),
                            new LessonSeed(topicMap["Travel"].Id, "Buying a ticket",
                                "Ticket office = Каса\nTimetable = Розклад\nSeat = Місце\nPlatform = Платформа\nTrain = Поїзд\nBus = Автобус\nPrice = Ціна\nCheap = Дешевий", 5),
                            new LessonSeed(topicMap["Travel"].Id, "Travel problems",
                                "Lost = Загублений\nDelayed = Затриманий\nHelp = Допомога\nInformation desk = Довідка\nSuitcase = Валіза\nProblem = Проблема\nPassport = Паспорт\nBag = Сумка", 6),
                            new LessonSeed(topicMap["Travel"].Id, "City sights",
                                "Map = Карта\nStreet = Вулиця\nMuseum = Музей\nPark = Парк\nBridge = Міст\nSquare = Площа\nNear = Біля\nFar = Далеко", 7),
                            new LessonSeed(topicMap["Travel"].Id, "Travel review",
                                "Gate = Вихід на посадку\nTicket office = Каса\nReservation = Бронювання\nDelayed = Затриманий\nHelp = Допомога\nMap = Карта\nCity center = Центр міста\nLuggage = Багаж", 8),
                            new LessonSeed(topicMap["Food & Cafe"].Id, "In a cafe",
                                "Coffee = Кава\nTea = Чай\nMenu = Меню\nBill = Рахунок\nWaiter = Офіціант\nWaitress = Офіціантка\nOrder = Замовлення\nTable for two = Столик на двох", 1),
                            new LessonSeed(topicMap["Food & Cafe"].Id, "How much is it?",
                                "How much = Скільки коштує\nPrice = Ціна\nCheap = Дешевий\nExpensive = Дорогий\nCash = Готівка\nCard = Картка\nReceipt = Чек\nBill = Рахунок", 2),
                            new LessonSeed(topicMap["Food & Cafe"].Id, "Ordering food",
                                "Soup = Суп\nSalad = Салат\nSandwich = Сендвіч\nPizza = Піца\nPasta = Паста\nRice = Рис\nDessert = Десерт\nJuice = Сік", 3),
                            new LessonSeed(topicMap["Food & Cafe"].Id, "Drinks and desserts",
                                "Water = Вода\nJuice = Сік\nCake = Торт\nIce cream = Морозиво\nSugar = Цукор\nMilk = Молоко\nTea = Чай\nCoffee = Кава", 4),
                            new LessonSeed(topicMap["Food & Cafe"].Id, "Breakfast, lunch and dinner",
                                "Breakfast = Сніданок\nLunch = Обід\nDinner = Вечеря\nHungry = Голодний\nThirsty = Спраглий\nBread = Хліб\nFish = Риба\nWater = Вода", 5),
                            new LessonSeed(topicMap["Food & Cafe"].Id, "At the restaurant",
                                "Restaurant = Ресторан\nReservation = Бронювання\nTable = Стіл\nMenu = Меню\nWaiter = Офіціант\nOrder = Замовлення\nDessert = Десерт\nBill = Рахунок", 6),
                            new LessonSeed(topicMap["Food & Cafe"].Id, "Paying the bill",
                                "Bill = Рахунок\nPay = Платити\nCash = Готівка\nCard = Картка\nChange = Решта\nTip = Чайові\nReceipt = Чек\nThank you = Дякую", 7),
                            new LessonSeed(topicMap["Food & Cafe"].Id, "Food review",
                                "Menu = Меню\nOrder = Замовлення\nSoup = Суп\nSalad = Салат\nBill = Рахунок\nReceipt = Чек\nCash = Готівка\nCard = Картка", 8),
                            new LessonSeed(topicMap["Family & Friends"].Id, "My family",
                                "father = тато / батько\nmother = мама\nbrother = брат\nsister = сестра\nparents = батьки\nfamily = сім'я / родина\ngrandmother = бабуся\ngrandfather = дідусь", 1),
                            new LessonSeed(topicMap["Family & Friends"].Id, "Relatives and greetings",
                                "uncle = дядько\naunt = тітка\ncousin = двоюрідний брат / двоюрідна сестра\nfriend = друг\nmother = мама\nfather = тато / батько\nhello = привіт\ngood morning = доброго ранку", 2),
                            new LessonSeed(topicMap["Family & Friends"].Id, "Personal information",
                                "name = ім'я\nage = вік\nphone = телефон\naddress = адреса\njob = робота / професія\ncountry = країна\ntoday = сьогодні\ntomorrow = завтра", 3),
                            new LessonSeed(topicMap["Family & Friends"].Id, "Appearance and character",
                                "tall = високий\nshort = низький\nyoung = молодий\nold = старий\nhappy = щасливий\nkind = добрий\nfunny = смішний\nfriendly = дружній", 4),
                            new LessonSeed(topicMap["Family & Friends"].Id, "Friends and hobbies",
                                "brother = брат\nfather = тато / батько\nfriend = друг\nschool = школа\nwork = працювати\nhobby = хобі\nmusic = музика\nparty = вечірка", 5),
                            new LessonSeed(topicMap["Family & Friends"].Id, "Plans together",
                                "visit = відвідувати\ninvite = запрошувати\ncall = дзвонити\nmeet = зустрічати / зустрічатися\nfriend = друг\ntoday = сьогодні\nevening = вечір\nweekend = вихідні", 6),
                            new LessonSeed(topicMap["Family & Friends"].Id, "Birthday time",
                                "gift = подарунок\nbirthday = день народження\nfamily = сім'я / родина\nparents = батьки\ncousin = двоюрідний брат / двоюрідна сестра\nhappy = щасливий\nthank you = дякую\nparty = вечірка", 7),
                            new LessonSeed(topicMap["Family & Friends"].Id, "Family review",
                                "family = сім'я / родина\nparents = батьки\nfriend = друг\ncousin = двоюрідний брат / двоюрідна сестра\nparty = вечірка\nkind = добрий\nvisit = відвідувати\nbirthday = день народження", 8),
                            new LessonSeed(topicMap["Home"].Id, "Rooms at home",
                                "house = будинок\nroom = кімната / номер\nkitchen = кухня\nbedroom = спальня\nbathroom = ванна кімната\nliving room = вітальня\nbed = ліжко\ntable = стіл", 1),
                            new LessonSeed(topicMap["Home"].Id, "Around the house",
                                "door = двері\nwindow = вікно\nfloor = підлога\nwall = стіна\nceiling = стеля\nstairs = сходи\ngarden = сад\nbalcony = балкон", 2),
                            new LessonSeed(topicMap["Home"].Id, "Furniture",
                                "sofa = диван\ndesk = письмовий стіл\nlamp = лампа\nmirror = дзеркало\nbed = ліжко\nchair = стілець\ntable = стіл\nwardrobe = шафа", 3),
                            new LessonSeed(topicMap["Home"].Id, "Home items",
                                "fridge = холодильник\ncooker = плита\nplate = тарілка\ncup = чашка\nspoon = ложка\nfork = виделка\nshower = душ\ntowel = рушник", 4),
                            new LessonSeed(topicMap["Home"].Id, "Home actions",
                                "open = відкривати\nclose = закривати\nclean = прибирати / чистий\nwash = мити\ncook = готувати\nrest = відпочивати\nroom = кімната / номер\nhouse = будинок", 5),
                            new LessonSeed(topicMap["Home"].Id, "Describing home",
                                "big = великий\nsmall = малий\nnew = новий\nold = старий\ncomfortable = зручний\nquiet = тихий\nbright = світлий\ndark = темний", 6),
                            new LessonSeed(topicMap["Home"].Id, "At home",
                                "family = сім'я / родина\nguest = гість\nstay = залишатися / зупинятися\nroom = кімната / номер\nhouse = будинок\nkey = ключ\nbed = ліжко\nnight = ніч", 7),
                            new LessonSeed(topicMap["Home"].Id, "Home review",
                                "kitchen = кухня\nbathroom = ванна кімната\ngarden = сад\nstairs = сходи\nsofa = диван\nshower = душ\nclean = прибирати / чистий\ncomfortable = зручний", 8),
                            new LessonSeed(topicMap["Daily Routine"].Id, "Morning routine",
                                "wake up = прокидатися\nmorning = ранок\nbreakfast = сніданок\nwash face = мити обличчя\nbrush teeth = чистити зуби\nget dressed = одягатися\nmake bed = застеляти ліжко\nschool = школа", 1),
                            new LessonSeed(topicMap["Daily Routine"].Id, "Time words",
                                "time = час\nearly = рано\nlate = пізно\ntoday = сьогодні\ntomorrow = завтра\nalways = завжди\nusually = зазвичай\nsometimes = інколи", 2),
                            new LessonSeed(topicMap["Daily Routine"].Id, "School and work day",
                                "lesson = урок\nhomework = домашнє завдання\nbreak = перерва\nstudy = вчитися\nstart = починати\nfinish = закінчувати\nlunch = обід\nwork = працювати", 3),
                            new LessonSeed(topicMap["Daily Routine"].Id, "After school",
                                "play = грати\nwalk = йти\nfriend = друг\nmusic = музика\nchat = спілкуватися\nrelax = відпочивати\nexercise = вправа / тренуватися\npark = парк", 4),
                            new LessonSeed(topicMap["Daily Routine"].Id, "Evening routine",
                                "come = приходити\nevening = вечір\ndinner = вечеря\nshower = душ\ncall = дзвонити\nfamily = сім'я / родина\ntelevision = телевізор\nnight = ніч", 5),
                            new LessonSeed(topicMap["Daily Routine"].Id, "Days of the week",
                                "Monday = понеділок\nTuesday = вівторок\nWednesday = середа\nThursday = четвер\nFriday = п’ятниця\nSaturday = субота\nSunday = неділя\nweekend = вихідні", 6),
                            new LessonSeed(topicMap["Daily Routine"].Id, "Free time",
                                "picnic = пікнік\ncinema = кінотеатр\npark = парк\nbike = велосипед\nvisit = відвідувати\nfriend = друг\ngame = гра\ntogether = разом", 7),
                            new LessonSeed(topicMap["Daily Routine"].Id, "Routine review",
                                "morning = ранок\nearly = рано\nhomework = домашнє завдання\nstudy = вчитися\ndinner = вечеря\ntelevision = телевізор\nweekend = вихідні\nrelax = відпочивати", 8),
                            new LessonSeed(topicMap["Shopping & Clothes"].Id, "In a shop",
                                "shop = магазин\nstore = крамниця / магазин\nbuy = купувати\nsell = продавати\nprice = ціна\ncash = готівка\ncard = картка\nbill = рахунок", 1),
                            new LessonSeed(topicMap["Shopping & Clothes"].Id, "Clothes basics",
                                "T-shirt = футболка\nshirt = сорочка\njeans = джинси\ntrousers = штани\ndress = сукня\nskirt = спідниця\njacket = куртка\ncoat = пальто", 2),
                            new LessonSeed(topicMap["Shopping & Clothes"].Id, "Shoes and accessories",
                                "shoes = взуття / туфлі\nboots = черевики / чоботи\nhat = шапка\ncap = кепка\nscarf = шарф\nbag = сумка\numbrella = парасоля\nnew = новий", 3),
                            new LessonSeed(topicMap["Shopping & Clothes"].Id, "Colors and style",
                                "red = червоний\nblack = чорний\nwhite = білий\nbrown = коричневий\npink = рожевий\ngrey = сірий\nbig = великий\nsmall = малий", 4),
                            new LessonSeed(topicMap["Shopping & Clothes"].Id, "Trying on clothes",
                                "size = розмір\nfit = підходити за розміром\ntoo big = занадто великий\ntoo small = занадто малий\nmedium = середній\ntry on = приміряти\nput on = одягати\ntake off = знімати", 5),
                            new LessonSeed(topicMap["Shopping & Clothes"].Id, "Payments and offers",
                                "receipt = чек / квитанція\ndiscount = знижка\nsale = розпродаж\nwallet = гаманець\ncoin = монета\nprice = ціна\ncheap = дешевий\nexpensive = дорогий", 6),
                            new LessonSeed(topicMap["Shopping & Clothes"].Id, "At the supermarket",
                                "basket = кошик\nshelf = полиця\nbottle = пляшка\npacket = пакет / упаковка\nkilo = кілограм\npiece = шматок / штука\nlist = список\nmarket = ринок / магазин", 7),
                            new LessonSeed(topicMap["Shopping & Clothes"].Id, "Shopping review",
                                "shop = магазин\njeans = джинси\nshoes = взуття / туфлі\numbrella = парасоля\nfit = підходити за розміром\nsale = розпродаж\nbasket = кошик\nmarket = ринок / магазин", 8),
                            new LessonSeed(topicMap["Weather & Seasons"].Id, "Seasons",
                                "spring = весна\nsummer = літо\nautumn = осінь\nwinter = зима\nweather = погода\nseason = пора року\nhot = гарячий\ncold = холодний", 1),
                            new LessonSeed(topicMap["Weather & Seasons"].Id, "Sunny days",
                                "sun = сонце\nsunny = сонячний\nsky = небо\ncloud = хмара\ncloudy = хмарний\nwarm = теплий\nblue = синій / блакитний\ntoday = сьогодні", 2),
                            new LessonSeed(topicMap["Weather & Seasons"].Id, "Rain and wind",
                                "rain = дощ\nrainy = дощовий\numbrella = парасоля\nwind = вітер\nwindy = вітряний\nwet = мокрий\njacket = куртка\nstorm = буря", 3),
                            new LessonSeed(topicMap["Weather & Seasons"].Id, "Cold weather",
                                "snow = сніг\nsnowy = сніжний\nice = лід\nboots = черевики / чоботи\nscarf = шарф\ngloves = рукавички\nfreeze = мерзнути / замерзати\nweather = погода", 4),
                            new LessonSeed(topicMap["Weather & Seasons"].Id, "Temperature",
                                "temperature = температура\ndegree = градус\nminus = мінус\nplus = плюс\nweather forecast = прогноз погоди\ntoday = сьогодні\ntomorrow = завтра\ncold = холодний", 5),
                            new LessonSeed(topicMap["Weather & Seasons"].Id, "Nature and plans",
                                "beach = пляж\nforest = ліс\nmountain = гора\nriver = річка\ntree = дерево\nflower = квітка\ngrass = трава\npark = парк", 6),
                            new LessonSeed(topicMap["Weather & Seasons"].Id, "What to wear",
                                "coat = пальто\nsweater = светр\nT-shirt = футболка\nshorts = шорти\nsunglasses = сонцезахисні окуляри\nraincoat = дощовик\ncap = кепка\nshoes = взуття / туфлі", 7),
                            new LessonSeed(topicMap["Weather & Seasons"].Id, "Weather review",
                                "spring = весна\nsunny = сонячний\nrainy = дощовий\nsnow = сніг\ntemperature = температура\nbeach = пляж\nsweater = светр\nweather forecast = прогноз погоди", 8),
                            new LessonSeed(topicMap["Health & Body"].Id, "Body parts 1",
                                "head = голова\nface = обличчя\neye = око\near = вухо\nnose = ніс\nmouth = рот\nhand = рука / кисть\nleg = нога", 1),
                            new LessonSeed(topicMap["Health & Body"].Id, "Body parts 2",
                                "arm = рука\nfoot = ступня / нога\ntooth = зуб\nback = спина\nstomach = живіт / шлунок\nhair = волосся\nneck = шия\nshoulder = плече", 2),
                            new LessonSeed(topicMap["Health & Body"].Id, "At the doctor",
                                "doctor = лікар\nnurse = медсестра\nhospital = лікарня\nmedicine = ліки\nappointment = прийом / запис\nhelp = допомога\nhealthy = здоровий\nsick = хворий", 3),
                            new LessonSeed(topicMap["Health & Body"].Id, "Common problems",
                                "headache = головний біль\ntoothache = зубний біль\ncough = кашель\ncold = застуда / холодний\nfever = температура / гарячка\nsore throat = біль у горлі\nrunny nose = нежить\ntired = втомлений", 4),
                            new LessonSeed(topicMap["Health & Body"].Id, "Healthy habits",
                                "water = вода\nbreakfast = сніданок\nfruit = фрукт\nwalk = йти\nsleep = спати\nexercise = вправа / тренуватися\nrest = відпочивати\nhealthy = здоровий", 5),
                            new LessonSeed(topicMap["Health & Body"].Id, "Feeling better",
                                "stay in bed = залишатися в ліжку\ntake medicine = приймати ліки\ndrink tea = пити чай\ncall a doctor = викликати лікаря\ncheck = перевіряти\nbetter = краще\nworse = гірше\nproblem = проблема", 6),
                            new LessonSeed(topicMap["Health & Body"].Id, "Emergencies and advice",
                                "ambulance = швидка допомога\ncareful = обережний\ndangerous = небезпечний\nbandage = бинт / пов’язка\nhurt = боліти / травмувати\naccident = нещасний випадок\nphone = телефон\nemergency = надзвичайна ситуація", 7),
                            new LessonSeed(topicMap["Health & Body"].Id, "Health review",
                                "doctor = лікар\nmedicine = ліки\nheadache = головний біль\nhealthy = здоровий\nfruit = фрукт\nrest = відпочивати\ncareful = обережний\nemergency = надзвичайна ситуація", 8),
                        };

            return lessons;
        }

        public static Dictionary<string, List<ExerciseSeed>> GetOnboardingExercisesByCourseTitle()
        {
            return new Dictionary<string, List<ExerciseSeed>>(StringComparer.OrdinalIgnoreCase)
            {
                ["English A2"] = new List<ExerciseSeed>
                {
                    new ExerciseSeed(ExerciseType.MultipleChoice, "Choose the correct sentence", ToJsonStringArray("She gets up at seven every day.", "She get up at seven every day.", "She getting up at seven every day."), "She gets up at seven every day.", 1),
                    new ExerciseSeed(ExerciseType.Match, "Match the phrases", ToJsonMatchPairs(
                        ("wake up", "прокидатися"),
                        ("have breakfast", "снідати"),
                        ("go to work", "йти на роботу"),
                        ("take a shower", "приймати душ")
                    ), "{}", 2),
                    new ExerciseSeed(ExerciseType.Input, "We ___ dinner at home every evening.", "{}", "have", 3)
                },
                ["English B1"] = new List<ExerciseSeed>
                {
                    new ExerciseSeed(ExerciseType.MultipleChoice, "After a long meeting, we decided to ___ and continue later.", ToJsonStringArray("take a break", "do a noise", "make a travel"), "take a break", 1),
                    new ExerciseSeed(ExerciseType.Match, "Match the expressions", ToJsonMatchPairs(
                        ("make a decision", "приймати рішення"),
                        ("solve a problem", "розв'язувати проблему"),
                        ("pay attention", "звертати увагу"),
                        ("miss an opportunity", "втрачати можливість")
                    ), "{}", 2),
                    new ExerciseSeed(ExerciseType.Input, "If I have time tomorrow, I ___ you.", "{}", "will call", 3)
                },
                ["English B2"] = new List<ExerciseSeed>
                {
                    new ExerciseSeed(ExerciseType.MultipleChoice, "The manager asked us to ___ the report before the meeting.", ToJsonStringArray("review", "repeat", "borrow"), "review", 1),
                    new ExerciseSeed(ExerciseType.Match, "Match the collocations", ToJsonMatchPairs(
                        ("meet a deadline", "вкластися в дедлайн"),
                        ("raise awareness", "підвищувати обізнаність"),
                        ("reach an agreement", "досягати згоди"),
                        ("take responsibility", "брати відповідальність")
                    ), "{}", 2),
                    new ExerciseSeed(ExerciseType.Input, "By the time we arrived, the film ___ .", "{}", "had started", 3)
                },
                ["English C1"] = new List<ExerciseSeed>
                {
                    new ExerciseSeed(ExerciseType.MultipleChoice, "The scientist presented a ___ analysis of the data.", ToJsonStringArray("comprehensive", "ordinary", "sudden"), "comprehensive", 1),
                    new ExerciseSeed(ExerciseType.Match, "Match the academic words", ToJsonMatchPairs(
                        ("significant", "значний"),
                        ("evidence", "доказ"),
                        ("approach", "підхід"),
                        ("outcome", "результат")
                    ), "{}", 2),
                    new ExerciseSeed(ExerciseType.Input, "It is essential that every detail ___ checked carefully.", "{}", "be", 3)
                }
            };
        }

        public static List<LessonExerciseSeed> GetLessonExercises()
        {
            return new List<LessonExerciseSeed>
            {
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 1",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "сестра", ToJsonStringArray("sister", "book", "table"), "sister", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("mother", "мама"),
                    ("book", "книжка"),
                    ("apple", "яблуко"),
                    ("house", "будинок")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "She ___ my mother.", "{}", "is", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I go to the ___ .", ToJsonStringArray("pen", "sun", "zoo"), "zoo", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("pen", "ручка"),
                    ("table", "стіл"),
                    ("friend", "друг"),
                    ("cat", "кіт")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "This is a ____ . (Це шапка)", "{}", "hat", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "It is a ___ .", ToJsonStringArray("sister", "chair", "teacher"), "chair", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("dog", "собака"),
                    ("chair", "стілець"),
                    ("school", "школа"),
                    ("milk", "молоко")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This is a ____ . (Це книжка)", "{}", "book", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 2",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "червоний", ToJsonStringArray("have", "morning", "red"), "red", 1, "/uploads/lessons/red.png"),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("water", "вода"),
                    ("bread", "хліб"),
                    ("milk", "молоко"),
                    ("apple", "яблуко")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "____ the window, please. (Відчини вікно, будь ласка)", "{}", "Open", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "He told us an interesting ____ .", ToJsonStringArray("fine", "story", "bear"), "story", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("window", "вікно"),
                    ("door", "двері"),
                    ("bed", "ліжко"),
                    ("cup", "чашка")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "I ate one ____ today. (Я з’їв одне яблуко сьогодні)", "{}", "apple", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "This cat ran into the ____ .", ToJsonStringArray("house", "like", "four"), "house", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("dog", "собака"),
                    ("cat", "кіт"),
                    ("bird", "птах"),
                    ("fish", "риба")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Let's ____ football!", "{}", "play", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 3",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "вікно", ToJsonStringArray("window", "sister", "teacher"), "window", 1, "/uploads/lessons/window.webp"),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("door", "двері"),
                    ("window", "вікно"),
                    ("floor", "підлога"),
                    ("wall", "стіна")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "It ___ a door.", "{}", "is", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I see a ___ .", ToJsonStringArray("cup", "mother", "teacher"), "cup", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("cup", "чашка"),
                    ("plate", "тарілка"),
                    ("spoon", "ложка"),
                    ("fork", "виделка")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "This is a ____ . (Це тарілка)", "{}", "plate", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "It is a ___ .", ToJsonStringArray("bag", "brother", "friend"), "bag", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("bag", "сумка"),
                    ("box", "коробка"),
                    ("phone", "телефон"),
                    ("key", "ключ")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This is a ____ . (Це ключ)", "{}", "key", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 4",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "собака", ToJsonStringArray("dog", "table", "chair"), "dog", 1, "/uploads/lessons/dog.png"),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("dog", "собака"),
                    ("cat", "кіт"),
                    ("bird", "птах"),
                    ("fish", "риба")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "It ___ a cat.", "{}", "is", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I have a ___ .", ToJsonStringArray("apple", "sister", "teacher"), "apple", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("apple", "яблуко"),
                    ("bread", "хліб"),
                    ("milk", "молоко"),
                    ("water", "вода")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "I have a ____ . (У мене є яблуко)", "{}", "apple", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "This is a ___ .", ToJsonStringArray("bus", "mother", "teacher"), "bus", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("car", "машина"),
                    ("bus", "автобус"),
                    ("bike", "велосипед"),
                    ("train", "поїзд")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This is a ____ . (Це машина)", "{}", "car", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 5",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "бігати", ToJsonStringArray("run", "table", "sister"), "run", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("run", "бігати"),
                    ("eat", "їсти"),
                    ("drink", "пити"),
                    ("sleep", "спати")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I ___ water.", "{}", "drink", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ an apple.", ToJsonStringArray("eat", "chair", "window"), "eat", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("read", "читати"),
                    ("write", "писати"),
                    ("open", "відкривати"),
                    ("close", "закривати")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "Please ___ the door. (Відчини двері)", "{}", "open", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ at night.", ToJsonStringArray("sleep", "table", "milk"), "sleep", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("walk", "йти"),
                    ("sit", "сидіти"),
                    ("stand", "стояти"),
                    ("look", "дивитися")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I ___ a book. (Я читаю книгу)", "{}", "read", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 6",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "щасливий", ToJsonStringArray("happy", "table", "dog"), "happy", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("big", "великий"),
                    ("small", "малий"),
                    ("hot", "гарячий"),
                    ("cold", "холодний")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "The water is ___ . (Вода холодна)", "{}", "cold", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "This is a ___ house.", ToJsonStringArray("big", "eat", "run"), "big", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("good", "добрий"),
                    ("bad", "поганий"),
                    ("new", "новий"),
                    ("old", "старий")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "This is a ___ car. (Це нова машина)", "{}", "new", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I feel ___ .", ToJsonStringArray("tired", "chair", "pen"), "tired", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("happy", "щасливий"),
                    ("sad", "сумний"),
                    ("tired", "втомлений"),
                    ("angry", "злий")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I am ___ . (Я щасливий/щаслива)", "{}", "happy", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 7",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "на", ToJsonStringArray("on", "run", "eat"), "on", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("on", "на"),
                    ("in", "в"),
                    ("under", "під"),
                    ("near", "біля")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "The cat is ___ the table. (Кіт під столом)", "{}", "under", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "The pen is ___ the bag.", ToJsonStringArray("in", "sleep", "big"), "in", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("here", "тут"),
                    ("there", "там"),
                    ("left", "ліворуч"),
                    ("right", "праворуч")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "The dog is ___ the house. (Собака біля будинку)", "{}", "near", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "The book is ___ the box.", ToJsonStringArray("under", "drink", "happy"), "under", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("above", "над"),
                    ("below", "під"),
                    ("inside", "всередині"),
                    ("outside", "ззовні")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The apple is ___ the table. (Яблуко на столі)", "{}", "on", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Basic words",
                    "Lesson 8",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "прокидатися", ToJsonStringArray("wake up", "chair", "table"), "wake up", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("wake up", "прокидатися"),
                    ("eat", "їсти"),
                    ("drink", "пити"),
                    ("sleep", "спати")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I ___ water. (Я п’ю воду)", "{}", "drink", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ breakfast.", ToJsonStringArray("eat", "run", "cold"), "eat", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("go", "йти"),
                    ("come", "приходити"),
                    ("play", "грати"),
                    ("work", "працювати")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "I ___ to school. (Я йду до школи)", "{}", "go", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ football.", ToJsonStringArray("play", "table", "door"), "play", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("morning", "ранок"),
                    ("day", "день"),
                    ("evening", "вечір"),
                    ("night", "ніч")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I sleep at ___. (Я сплю вночі)", "{}", "night", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Present Simple: I / you",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ coffee.", ToJsonStringArray("drink", "chair", "big"), "drink", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("I eat", "я їм"),
                    ("I drink", "я п’ю"),
                    ("I read", "я читаю"),
                    ("I play", "я граю")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I ___ a book. (Я читаю книгу)", "{}", "read", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "You ___ very fast.", ToJsonStringArray("run", "table", "cold"), "run", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("I work", "я працюю"),
                    ("I sleep", "я сплю"),
                    ("I go", "я йду"),
                    ("I come", "я приходжу")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "You ___ water. (Ти п’єш воду)", "{}", "drink", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ every day.", ToJsonStringArray("work", "apple", "chair"), "work", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("you eat", "ти їси"),
                    ("you drink", "ти п’єш"),
                    ("you read", "ти читаєш"),
                    ("you play", "ти граєш")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I ___ to school. (Я йду до школи)", "{}", "go", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Present Simple: he / she",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "He ___ coffee.", ToJsonStringArray("drink", "drinks", "drinking"), "drinks", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he eats", "він їсть"),
                    ("she drinks", "вона п’є"),
                    ("he reads", "він читає"),
                    ("she plays", "вона грає")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "He ___ a book. (Він читає книгу)", "{}", "reads", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "She ___ every day.", ToJsonStringArray("run", "runs", "running"), "runs", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he works", "він працює"),
                    ("she sleeps", "вона спить"),
                    ("he goes", "він йде"),
                    ("she comes", "вона приходить")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "She ___ water. (Вона п’є воду)", "{}", "drinks", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "He ___ football.", ToJsonStringArray("play", "plays", "playing"), "plays", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he runs", "він біжить"),
                    ("she eats", "вона їсть"),
                    ("he drinks", "він п’є"),
                    ("she reads", "вона читає")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "He ___ to school. (Він йде до школи)", "{}", "goes", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Negative: I / you — don’t",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ like coffee.", ToJsonStringArray("don’t", "doesn’t", "not"), "don’t", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("I don’t eat", "я не їм"),
                    ("I don’t drink", "я не п’ю"),
                    ("I don’t read", "я не читаю"),
                    ("I don’t play", "я не граю")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I ___ like milk. (Я не люблю молоко)", "{}", "don’t", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "You ___ work today.", ToJsonStringArray("don’t", "doesn’t", "not"), "don’t", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("you don’t go", "ти не йдеш"),
                    ("you don’t sleep", "ти не спиш"),
                    ("you don’t work", "ти не працюєш"),
                    ("you don’t come", "ти не приходиш")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "You ___ eat meat. (Ти не їси м’ясо)", "{}", "don’t", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "I ___ play football.", ToJsonStringArray("don’t", "doesn’t", "no"), "don’t", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("I don’t like", "я не люблю"),
                    ("you don’t drink", "ти не п’єш"),
                    ("I don’t go", "я не йду"),
                    ("you don’t read", "ти не читаєш")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I ___ go to school. (Я не йду до школи)", "{}", "don’t", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Negative: he / she — doesn’t",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "He ___ like coffee.", ToJsonStringArray("don’t", "doesn’t", "not"), "doesn’t", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he doesn’t eat", "він не їсть"),
                    ("she doesn’t drink", "вона не п’є"),
                    ("he doesn’t read", "він не читає"),
                    ("she doesn’t play", "вона не грає")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "He ___ like milk. (Він не любить молоко)", "{}", "doesn’t", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "She ___ work today.", ToJsonStringArray("don’t", "doesn’t", "not"), "doesn’t", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he doesn’t go", "він не йде"),
                    ("she doesn’t sleep", "вона не спить"),
                    ("he doesn’t work", "він не працює"),
                    ("she doesn’t come", "вона не приходить")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "She ___ eat meat. (Вона не їсть м’ясо)", "{}", "doesn’t", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "He ___ play football.", ToJsonStringArray("don’t", "doesn’t", "no"), "doesn’t", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("he doesn’t like", "він не любить"),
                    ("she doesn’t drink", "вона не п’є"),
                    ("he doesn’t go", "він не йде"),
                    ("she doesn’t read", "вона не читає")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "He ___ go to school. (Він не йде до школи)", "{}", "doesn’t", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Questions: Do you…?",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ you like coffee?", ToJsonStringArray("Do", "Does", "Are"), "Do", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Do you eat?", "Ти їси?"),
                    ("Do you drink?", "Ти п’єш?"),
                    ("Do you read?", "Ти читаєш?"),
                    ("Do you play?", "Ти граєш?")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "___ you go to school? (Ти йдеш до школи?)", "{}", "Do", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ you work today?", ToJsonStringArray("Do", "Does", "Is"), "Do", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Do you go?", "Ти йдеш?"),
                    ("Do you sleep?", "Ти спиш?"),
                    ("Do you work?", "Ти працюєш?"),
                    ("Do you come?", "Ти приходиш?")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "___ you like apples? (Ти любиш яблука?)", "{}", "Do", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ you play football?", ToJsonStringArray("Do", "Does", "Are"), "Do", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Do you like?", "Ти любиш?"),
                    ("Do you drink?", "Ти п’єш?"),
                    ("Do you go?", "Ти йдеш?"),
                    ("Do you read?", "Ти читаєш?")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "___ you read books? (Ти читаєш книги?)", "{}", "Do", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Short answers: Yes / No",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "Do you like coffee? — Yes, I ___ .", ToJsonStringArray("do", "am", "is"), "do", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, I do", "Так, я люблю"),
                    ("No, I don’t", "Ні, я не люблю"),
                    ("Yes, I do", "Так, я читаю"),
                    ("No, I don’t", "Ні, я не читаю")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Do you read? — Yes, I ___ .", "{}", "do", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Do you drink milk? — No, I ___ .", ToJsonStringArray("don’t", "doesn’t", "not"), "don’t", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, I do", "Так, я п’ю"),
                    ("No, I don’t", "Ні, я не п’ю"),
                    ("Yes, I do", "Так, я йду"),
                    ("No, I don’t", "Ні, я не йду")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "Do you work? — No, I ___ .", "{}", "don’t", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Do you play football? — Yes, I ___ .", ToJsonStringArray("do", "am", "is"), "do", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, I do", "Так, я граю"),
                    ("No, I don’t", "Ні, я не граю"),
                    ("Yes, I do", "Так, я працюю"),
                    ("No, I don’t", "Ні, я не працюю")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Do you eat apples? — Yes, I ___ .", "{}", "do", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Questions: Does he / she…?",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ he like coffee?", ToJsonStringArray("Do", "Does", "Is"), "Does", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Does he eat?", "Він їсть?"),
                    ("Does she drink?", "Вона п’є?"),
                    ("Does he read?", "Він читає?"),
                    ("Does she play?", "Вона грає?")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "___ she go to school? (Вона йде до школи?)", "{}", "Does", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ he work today?", ToJsonStringArray("Do", "Does", "Are"), "Does", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Does he go?", "Він йде?"),
                    ("Does she sleep?", "Вона спить?"),
                    ("Does he work?", "Він працює?"),
                    ("Does she come?", "Вона приходить?")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "___ he like apples? (Він любить яблука?)", "{}", "Does", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "___ she play football?", ToJsonStringArray("Do", "Does", "Is"), "Does", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Does he like?", "Він любить?"),
                    ("Does she drink?", "Вона п’є?"),
                    ("Does he go?", "Він йде?"),
                    ("Does she read?", "Вона читає?")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "___ she read books? (Вона читає книги?)", "{}", "Does", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Simple sentences",
                    "Short answers: he / she",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "Does he like coffee? — Yes, he ___ .", ToJsonStringArray("do", "does", "is"), "does", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, he does", "Так, він любить"),
                    ("No, he doesn’t", "Ні, він не любить"),
                    ("Yes, she does", "Так, вона любить"),
                    ("No, she doesn’t", "Ні, вона не любить")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Does she read? — Yes, she ___ .", "{}", "does", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Does he drink milk? — No, he ___ .", ToJsonStringArray("don’t", "doesn’t", "not"), "doesn’t", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, he does", "Так, він працює"),
                    ("No, he doesn’t", "Ні, він не працює"),
                    ("Yes, she does", "Так, вона читає"),
                    ("No, she doesn’t", "Ні, вона не читає")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "Does she work? — No, she ___ .", "{}", "doesn’t", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Does he play football? — Yes, he ___ .", ToJsonStringArray("do", "does", "is"), "does", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Yes, he does", "Так, він грає"),
                    ("No, he doesn’t", "Ні, він не грає"),
                    ("Yes, she does", "Так, вона п’є"),
                    ("No, she doesn’t", "Ні, вона не п’є")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Does he eat apples? — Yes, he ___ .", "{}", "does", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Travel",
                    "At the airport",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "airport", ToJsonStringArray("аеропорт", "квиток", "паспорт"), "аеропорт", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("airport", "аеропорт"),
                    ("ticket", "квиток"),
                    ("passport", "паспорт"),
                    ("gate", "вихід на посадку")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I show my ___ at check-in. (Я показую свій квиток на реєстрації)", "{}", "ticket", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "boarding pass", ToJsonStringArray("посадковий талон", "рейс", "реєстрація"), "посадковий талон", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("boarding pass", "посадковий талон"),
                    ("flight", "рейс"),
                    ("check-in", "реєстрація"),
                    ("luggage", "багаж")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "flight", "{}", "рейс", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "check-in", ToJsonStringArray("реєстрація", "аеропорт", "багаж"), "реєстрація", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("airport", "аеропорт"),
                    ("passport", "паспорт"),
                    ("boarding pass", "посадковий талон"),
                    ("check-in", "реєстрація")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "My ___ is very heavy. (Мій багаж дуже важкий)", "{}", "luggage", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Travel",
                    "Asking directions",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "where", ToJsonStringArray("де", "ліворуч", "праворуч"), "де", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("where", "де"),
                    ("left", "ліворуч"),
                    ("right", "праворуч"),
                    ("go", "йти")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Turn ___ at the corner. (Поверни ліворуч на розі)", "{}", "left", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "map", ToJsonStringArray("карта", "вулиця", "ріг"), "карта", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("map", "карта"),
                    ("street", "вулиця"),
                    ("corner", "ріг"),
                    ("city center", "центр міста")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "street", "{}", "вулиця", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "corner", ToJsonStringArray("ріг", "де", "центр міста"), "ріг", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("where", "де"),
                    ("right", "праворуч"),
                    ("map", "карта"),
                    ("corner", "ріг")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The hotel is in the ___ . (Готель у центрі міста)", "{}", "city center", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Travel",
                    "Hotel check-in",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "hotel", ToJsonStringArray("готель", "бронювання", "рецепція"), "готель", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("hotel", "готель"),
                    ("reservation", "бронювання"),
                    ("reception", "рецепція"),
                    ("room", "номер")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I have a ___ for two nights. (У мене є бронювання на дві ночі)", "{}", "reservation", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "single room", ToJsonStringArray("одномісний номер", "двомісний номер", "картка-ключ"), "одномісний номер", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("single room", "одномісний номер"),
                    ("double room", "двомісний номер"),
                    ("key card", "картка-ключ"),
                    ("check in", "заселятися")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "double room", "{}", "двомісний номер", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "key card", ToJsonStringArray("картка-ключ", "готель", "заселятися"), "картка-ключ", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("hotel", "готель"),
                    ("reception", "рецепція"),
                    ("single room", "одномісний номер"),
                    ("key card", "картка-ключ")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "We ___ at the hotel at 6 p.m. (Ми заселяємося в готель о 6 вечора)", "{}", "check in", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Travel",
                    "Public transport",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "bus stop", ToJsonStringArray("автобусна зупинка", "залізничний вокзал", "платформа"), "автобусна зупинка", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("bus stop", "автобусна зупинка"),
                    ("train station", "залізничний вокзал"),
                    ("platform", "платформа"),
                    ("taxi", "таксі")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I am at the ___ now. (Я зараз на залізничному вокзалі)", "{}", "train station", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "one-way ticket", ToJsonStringArray("квиток в один бік", "квиток назад", "відправлення"), "квиток в один бік", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("one-way ticket", "квиток в один бік"),
                    ("return ticket", "квиток назад"),
                    ("departures", "відправлення"),
                    ("arrivals", "прибуття")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "return ticket", "{}", "квиток назад", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "departures", ToJsonStringArray("відправлення", "автобусна зупинка", "прибуття"), "відправлення", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("bus stop", "автобусна зупинка"),
                    ("platform", "платформа"),
                    ("one-way ticket", "квиток в один бік"),
                    ("departures", "відправлення")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Look at the ___ board. (Подивись на табло прибуття)", "{}", "arrivals", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Travel",
                    "Buying a ticket",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "ticket office", ToJsonStringArray("каса", "розклад", "місце"), "каса", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("ticket office", "каса"),
                    ("timetable", "розклад"),
                    ("seat", "місце"),
                    ("platform", "платформа")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I check the ___ before the trip. (Я дивлюся розклад перед поїздкою)", "{}", "timetable", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "train", ToJsonStringArray("поїзд", "автобус", "ціна"), "поїзд", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("train", "поїзд"),
                    ("bus", "автобус"),
                    ("price", "ціна"),
                    ("cheap", "дешевий")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "bus", "{}", "автобус", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "price", ToJsonStringArray("ціна", "каса", "дешевий"), "ціна", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("ticket office", "каса"),
                    ("seat", "місце"),
                    ("train", "поїзд"),
                    ("price", "ціна")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This ticket is very ___ . (Цей квиток дуже дешевий)", "{}", "cheap", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Travel",
                    "Travel problems",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "lost", ToJsonStringArray("загублений", "затриманий", "допомога"), "загублений", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("lost", "загублений"),
                    ("delayed", "затриманий"),
                    ("help", "допомога"),
                    ("information desk", "довідка")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "The train is ___ again. (Потяг знову затриманий)", "{}", "delayed", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "suitcase", ToJsonStringArray("валіза", "проблема", "паспорт"), "валіза", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("suitcase", "валіза"),
                    ("problem", "проблема"),
                    ("passport", "паспорт"),
                    ("bag", "сумка")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "problem", "{}", "проблема", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "passport", ToJsonStringArray("паспорт", "загублений", "сумка"), "паспорт", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("lost", "загублений"),
                    ("help", "допомога"),
                    ("suitcase", "валіза"),
                    ("passport", "паспорт")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "My ___ is black. (Моя сумка чорна)", "{}", "bag", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Travel",
                    "City sights",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "map", ToJsonStringArray("карта", "вулиця", "музей"), "карта", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("map", "карта"),
                    ("street", "вулиця"),
                    ("museum", "музей"),
                    ("park", "парк")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "This ___ is near the museum. (Ця вулиця біля музею)", "{}", "street", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "bridge", ToJsonStringArray("міст", "площа", "біля"), "міст", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("bridge", "міст"),
                    ("square", "площа"),
                    ("near", "біля"),
                    ("far", "далеко")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "square", "{}", "площа", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "near", ToJsonStringArray("біля", "карта", "далеко"), "біля", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("map", "карта"),
                    ("museum", "музей"),
                    ("bridge", "міст"),
                    ("near", "біля")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The station is ___ from here. (Станція далеко звідси)", "{}", "far", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Travel",
                    "Travel review",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "gate", ToJsonStringArray("вихід на посадку", "каса", "бронювання"), "вихід на посадку", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("gate", "вихід на посадку"),
                    ("ticket office", "каса"),
                    ("reservation", "бронювання"),
                    ("delayed", "затриманий")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I buy the ticket at the ___ . (Я купую квиток у касі)", "{}", "ticket office", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "help", ToJsonStringArray("допомога", "карта", "центр міста"), "допомога", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("help", "допомога"),
                    ("map", "карта"),
                    ("city center", "центр міста"),
                    ("luggage", "багаж")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "map", "{}", "карта", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "city center", ToJsonStringArray("центр міста", "вихід на посадку", "багаж"), "центр міста", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("gate", "вихід на посадку"),
                    ("reservation", "бронювання"),
                    ("help", "допомога"),
                    ("city center", "центр міста")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Her ___ is under the seat. (Її багаж під сидінням)", "{}", "luggage", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Food & Cafe",
                    "In a cafe",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "coffee", ToJsonStringArray("кава", "чай", "меню"), "кава", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("coffee", "кава"),
                    ("tea", "чай"),
                    ("menu", "меню"),
                    ("bill", "рахунок")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I would like a cup of ___ . (Я б хотів чашку чаю)", "{}", "tea", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "waiter", ToJsonStringArray("офіціант", "офіціантка", "замовлення"), "офіціант", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("waiter", "офіціант"),
                    ("waitress", "офіціантка"),
                    ("order", "замовлення"),
                    ("table for two", "столик на двох")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "waitress", "{}", "офіціантка", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "order", ToJsonStringArray("замовлення", "кава", "столик на двох"), "замовлення", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("coffee", "кава"),
                    ("menu", "меню"),
                    ("waiter", "офіціант"),
                    ("order", "замовлення")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "We need a ___ near the window. (Нам потрібен столик на двох біля вікна)", "{}", "table for two", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Food & Cafe",
                    "How much is it?",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "how much", ToJsonStringArray("скільки коштує", "ціна", "дешевий"), "скільки коштує", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("how much", "скільки коштує"),
                    ("price", "ціна"),
                    ("cheap", "дешевий"),
                    ("expensive", "дорогий")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "What is the ___ of this cake? (Яка ціна цього торта?)", "{}", "price", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "cash", ToJsonStringArray("готівка", "картка", "чек"), "готівка", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("cash", "готівка"),
                    ("card", "картка"),
                    ("receipt", "чек"),
                    ("bill", "рахунок")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "card", "{}", "картка", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "receipt", ToJsonStringArray("чек", "скільки коштує", "рахунок"), "чек", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("how much", "скільки коштує"),
                    ("cheap", "дешевий"),
                    ("cash", "готівка"),
                    ("receipt", "чек")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Can we have the ___ , please? (Можна рахунок, будь ласка?)", "{}", "bill", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Food & Cafe",
                    "Ordering food",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "soup", ToJsonStringArray("суп", "салат", "сендвіч"), "суп", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("soup", "суп"),
                    ("salad", "салат"),
                    ("sandwich", "сендвіч"),
                    ("pizza", "піца")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I want a ___ with tomatoes. (Я хочу салат з помідорами)", "{}", "salad", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "pasta", ToJsonStringArray("паста", "рис", "десерт"), "паста", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("pasta", "паста"),
                    ("rice", "рис"),
                    ("dessert", "десерт"),
                    ("juice", "сік")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "rice", "{}", "рис", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "dessert", ToJsonStringArray("десерт", "суп", "сік"), "десерт", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("soup", "суп"),
                    ("sandwich", "сендвіч"),
                    ("pasta", "паста"),
                    ("dessert", "десерт")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I drink orange ___ in the morning. (Я п’ю апельсиновий сік зранку)", "{}", "juice", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Food & Cafe",
                    "Drinks and desserts",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "water", ToJsonStringArray("вода", "сік", "торт"), "вода", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("water", "вода"),
                    ("juice", "сік"),
                    ("cake", "торт"),
                    ("ice cream", "морозиво")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Apple ___ is my favorite drink. (Яблучний сік — мій улюблений напій)", "{}", "juice", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "sugar", ToJsonStringArray("цукор", "молоко", "чай"), "цукор", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("sugar", "цукор"),
                    ("milk", "молоко"),
                    ("tea", "чай"),
                    ("coffee", "кава")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "milk", "{}", "молоко", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "tea", ToJsonStringArray("чай", "вода", "кава"), "чай", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("water", "вода"),
                    ("cake", "торт"),
                    ("sugar", "цукор"),
                    ("tea", "чай")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I need hot ___ in the morning. (Мені потрібна гаряча кава зранку)", "{}", "coffee", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Food & Cafe",
                    "Breakfast, lunch and dinner",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "breakfast", ToJsonStringArray("сніданок", "обід", "вечеря"), "сніданок", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("breakfast", "сніданок"),
                    ("lunch", "обід"),
                    ("dinner", "вечеря"),
                    ("hungry", "голодний")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "We have ___ at one o'clock. (Ми обідаємо о першій годині)", "{}", "lunch", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "thirsty", ToJsonStringArray("спраглий", "хліб", "риба"), "спраглий", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("thirsty", "спраглий"),
                    ("bread", "хліб"),
                    ("fish", "риба"),
                    ("water", "вода")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "bread", "{}", "хліб", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "fish", ToJsonStringArray("риба", "сніданок", "вода"), "риба", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("breakfast", "сніданок"),
                    ("dinner", "вечеря"),
                    ("thirsty", "спраглий"),
                    ("fish", "риба")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I drink ___ when I am thirsty. (Я п’ю воду, коли хочу пити)", "{}", "water", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Food & Cafe",
                    "At the restaurant",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "restaurant", ToJsonStringArray("ресторан", "бронювання", "стіл"), "ресторан", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("restaurant", "ресторан"),
                    ("reservation", "бронювання"),
                    ("table", "стіл"),
                    ("menu", "меню")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "We have a ___ for tonight. (У нас є бронювання на сьогоднішній вечір)", "{}", "reservation", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "waiter", ToJsonStringArray("офіціант", "замовлення", "десерт"), "офіціант", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("waiter", "офіціант"),
                    ("order", "замовлення"),
                    ("dessert", "десерт"),
                    ("bill", "рахунок")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "order", "{}", "замовлення", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "dessert", ToJsonStringArray("десерт", "ресторан", "рахунок"), "десерт", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("restaurant", "ресторан"),
                    ("table", "стіл"),
                    ("waiter", "офіціант"),
                    ("dessert", "десерт")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Please bring the ___ . (Будь ласка, принесіть рахунок)", "{}", "bill", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Food & Cafe",
                    "Paying the bill",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "bill", ToJsonStringArray("рахунок", "платити", "готівка"), "рахунок", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("bill", "рахунок"),
                    ("pay", "платити"),
                    ("cash", "готівка"),
                    ("card", "картка")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I ___ for dinner with my card. (Я плачу за вечерю карткою)", "{}", "pay", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "change", ToJsonStringArray("решта", "чайові", "чек"), "решта", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("change", "решта"),
                    ("tip", "чайові"),
                    ("receipt", "чек"),
                    ("thank you", "дякую")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "tip", "{}", "чайові", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "receipt", ToJsonStringArray("чек", "рахунок", "дякую"), "чек", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("bill", "рахунок"),
                    ("cash", "готівка"),
                    ("change", "решта"),
                    ("receipt", "чек")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I say ___ before I leave. (Я кажу дякую перед тим, як піти)", "{}", "thank you", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Food & Cafe",
                    "Food review",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "menu", ToJsonStringArray("меню", "замовлення", "суп"), "меню", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("menu", "меню"),
                    ("order", "замовлення"),
                    ("soup", "суп"),
                    ("salad", "салат")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Our ___ is on the table now. (Наше замовлення вже на столі)", "{}", "order", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "bill", ToJsonStringArray("рахунок", "чек", "готівка"), "рахунок", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("bill", "рахунок"),
                    ("receipt", "чек"),
                    ("cash", "готівка"),
                    ("card", "картка")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "receipt", "{}", "чек", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "cash", ToJsonStringArray("готівка", "меню", "картка"), "готівка", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("menu", "меню"),
                    ("soup", "суп"),
                    ("bill", "рахунок"),
                    ("cash", "готівка")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I pay by ___ at the cafe. (Я плачу карткою в кафе)", "{}", "card", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Family & Friends",
                    "My family",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "father", ToJsonStringArray("тато", "мама", "брат"), "тато", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("father", "тато"),
                    ("mother", "мама"),
                    ("brother", "брат"),
                    ("sister", "сестра")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "This is my ___ . (Це моя мама)", "{}", "mother", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "parents", ToJsonStringArray("батьки", "сім'я", "бабуся"), "батьки", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("parents", "батьки"),
                    ("family", "сім'я"),
                    ("grandmother", "бабуся"),
                    ("grandfather", "дідусь")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "сім'я", "{}", "family", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "бабуся", ToJsonStringArray("grandmother", "father", "brother"), "grandmother", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("father", "тато"),
                    ("brother", "брат"),
                    ("parents", "батьки"),
                    ("grandmother", "бабуся")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "My ___ tells funny stories. (Мій дідусь розповідає смішні історії)", "{}", "grandfather", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Family & Friends",
                    "Relatives and greetings",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "uncle", ToJsonStringArray("дядько", "тітка", "двоюрідний брат"), "дядько", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("uncle", "дядько"),
                    ("aunt", "тітка"),
                    ("cousin", "двоюрідний брат"),
                    ("friend", "друг")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "My ___ lives in Kyiv. (Моя тітка живе в Києві)", "{}", "aunt", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "mother", ToJsonStringArray("мама", "тато", "привіт"), "мама", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("mother", "мама"),
                    ("father", "тато"),
                    ("hello", "привіт"),
                    ("good morning", "доброго ранку")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "тато", "{}", "father", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "привіт", ToJsonStringArray("hello", "uncle", "cousin"), "hello", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("uncle", "дядько"),
                    ("cousin", "двоюрідний брат"),
                    ("mother", "мама"),
                    ("hello", "привіт")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I say ___ to my teacher. (Я кажу доброго ранку своєму вчителю)", "{}", "good morning", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Family & Friends",
                    "Personal information",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "name", ToJsonStringArray("ім'я", "вік", "телефон"), "ім'я", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("name", "ім'я"),
                    ("age", "вік"),
                    ("phone", "телефон"),
                    ("address", "адреса")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "My ___ is twelve. (Мій вік — дванадцять)", "{}", "age", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "job", ToJsonStringArray("робота", "країна", "сьогодні"), "робота", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("job", "робота"),
                    ("country", "країна"),
                    ("today", "сьогодні"),
                    ("tomorrow", "завтра")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "країна", "{}", "country", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "сьогодні", ToJsonStringArray("today", "name", "phone"), "today", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("name", "ім'я"),
                    ("phone", "телефон"),
                    ("job", "робота"),
                    ("today", "сьогодні")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "See you ___ . (Побачимось завтра)", "{}", "tomorrow", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Family & Friends",
                    "Appearance and character",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "tall", ToJsonStringArray("високий", "низький", "молодий"), "високий", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("tall", "високий"),
                    ("short", "низький"),
                    ("young", "молодий"),
                    ("old", "старий")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "He is not tall, he is ___ . (Він не високий, він низький)", "{}", "short", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "happy", ToJsonStringArray("щасливий", "добрий", "смішний"), "щасливий", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("happy", "щасливий"),
                    ("kind", "добрий"),
                    ("funny", "смішний"),
                    ("friendly", "дружній")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "добрий", "{}", "kind", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "смішний", ToJsonStringArray("funny", "tall", "young"), "funny", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("tall", "високий"),
                    ("young", "молодий"),
                    ("happy", "щасливий"),
                    ("funny", "смішний")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Our new neighbor is very ___ . (Наш новий сусід дуже дружній)", "{}", "friendly", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Family & Friends",
                    "Friends and hobbies",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "brother", ToJsonStringArray("брат", "тато", "друг"), "брат", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("brother", "брат"),
                    ("father", "тато"),
                    ("friend", "друг"),
                    ("school", "школа")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "My ___ likes football. (Мій тато любить футбол)", "{}", "father", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "work", ToJsonStringArray("працювати", "хобі", "музика"), "працювати", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("work", "працювати"),
                    ("hobby", "хобі"),
                    ("music", "музика"),
                    ("party", "вечірка")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "хобі", "{}", "hobby", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "музика", ToJsonStringArray("music", "brother", "friend"), "music", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("brother", "брат"),
                    ("friend", "друг"),
                    ("work", "працювати"),
                    ("music", "музика")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "We are going to a ___ in the evening. (Ми йдемо на вечірку ввечері)", "{}", "party", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Family & Friends",
                    "Plans together",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "visit", ToJsonStringArray("відвідувати", "запрошувати", "дзвонити"), "відвідувати", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("visit", "відвідувати"),
                    ("invite", "запрошувати"),
                    ("call", "дзвонити"),
                    ("meet", "зустрічати")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I want to ___ my friend to dinner. (Я хочу запросити друга на вечерю)", "{}", "invite", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "friend", ToJsonStringArray("друг", "сьогодні", "вечір"), "друг", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("friend", "друг"),
                    ("today", "сьогодні"),
                    ("evening", "вечір"),
                    ("weekend", "вихідні")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "сьогодні", "{}", "today", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "вечір", ToJsonStringArray("evening", "visit", "call"), "evening", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("visit", "відвідувати"),
                    ("call", "дзвонити"),
                    ("friend", "друг"),
                    ("evening", "вечір")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "On the ___ we go to grandma. (На вихідні ми їдемо до бабусі)", "{}", "weekend", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Family & Friends",
                    "Birthday time",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "gift", ToJsonStringArray("подарунок", "день народження", "сім'я"), "подарунок", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("gift", "подарунок"),
                    ("birthday", "день народження"),
                    ("family", "сім'я"),
                    ("parents", "батьки")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "My ___ is in May. (Мій день народження у травні)", "{}", "birthday", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "cousin", ToJsonStringArray("двоюрідний брат", "щасливий", "дякую"), "двоюрідний брат", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("cousin", "двоюрідний брат"),
                    ("happy", "щасливий"),
                    ("thank you", "дякую"),
                    ("party", "вечірка")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "щасливий", "{}", "happy", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "дякую", ToJsonStringArray("thank you", "gift", "family"), "thank you", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("gift", "подарунок"),
                    ("family", "сім'я"),
                    ("cousin", "двоюрідний брат"),
                    ("thank you", "дякую")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "We have a ___ at home tonight. (У нас удома сьогодні вечірка)", "{}", "party", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Family & Friends",
                    "Family review",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "family", ToJsonStringArray("сім'я", "батьки", "друг"), "сім'я", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("family", "сім'я"),
                    ("parents", "батьки"),
                    ("friend", "друг"),
                    ("cousin", "двоюрідний брат")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "My ___ are at work now. (Мої батьки зараз на роботі)", "{}", "parents", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "party", ToJsonStringArray("вечірка", "добрий", "відвідувати"), "вечірка", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("party", "вечірка"),
                    ("kind", "добрий"),
                    ("visit", "відвідувати"),
                    ("birthday", "день народження")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "добрий", "{}", "kind", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "відвідувати", ToJsonStringArray("visit", "family", "friend"), "visit", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("family", "сім'я"),
                    ("friend", "друг"),
                    ("party", "вечірка"),
                    ("visit", "відвідувати")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Today is my sister's ___ . (Сьогодні день народження моєї сестри)", "{}", "birthday", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Home",
                    "Rooms at home",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "house", ToJsonStringArray("будинок", "кімната", "кухня"), "будинок", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("house", "будинок"),
                    ("room", "кімната"),
                    ("kitchen", "кухня"),
                    ("bedroom", "спальня")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "My ___ is very clean. (Моя кімната дуже чиста)", "{}", "room", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "bathroom", ToJsonStringArray("ванна кімната", "вітальня", "ліжко"), "ванна кімната", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("bathroom", "ванна кімната"),
                    ("living room", "вітальня"),
                    ("bed", "ліжко"),
                    ("table", "стіл")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "вітальня", "{}", "living room", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "ліжко", ToJsonStringArray("bed", "house", "kitchen"), "bed", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("house", "будинок"),
                    ("kitchen", "кухня"),
                    ("bathroom", "ванна кімната"),
                    ("bed", "ліжко")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "There is a big ___ in the kitchen. (На кухні стоїть великий стіл)", "{}", "table", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Home",
                    "Around the house",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "door", ToJsonStringArray("двері", "вікно", "підлога"), "двері", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("door", "двері"),
                    ("window", "вікно"),
                    ("floor", "підлога"),
                    ("wall", "стіна")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Please open the ___ . (Будь ласка, відчини вікно)", "{}", "window", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "ceiling", ToJsonStringArray("стеля", "сходи", "сад"), "стеля", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("ceiling", "стеля"),
                    ("stairs", "сходи"),
                    ("garden", "сад"),
                    ("balcony", "балкон")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "сходи", "{}", "stairs", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "сад", ToJsonStringArray("garden", "door", "floor"), "garden", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("door", "двері"),
                    ("floor", "підлога"),
                    ("ceiling", "стеля"),
                    ("garden", "сад")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "We drink tea on the ___ . (Ми п’ємо чай на балконі)", "{}", "balcony", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Home",
                    "Furniture",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "sofa", ToJsonStringArray("диван", "письмовий стіл", "лампа"), "диван", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("sofa", "диван"),
                    ("desk", "письмовий стіл"),
                    ("lamp", "лампа"),
                    ("mirror", "дзеркало")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I work at my ___ every evening. (Я працюю за письмовим столом щовечора)", "{}", "desk", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "bed", ToJsonStringArray("ліжко", "стілець", "стіл"), "ліжко", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("bed", "ліжко"),
                    ("chair", "стілець"),
                    ("table", "стіл"),
                    ("wardrobe", "шафа")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "стілець", "{}", "chair", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "стіл", ToJsonStringArray("table", "sofa", "lamp"), "table", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("sofa", "диван"),
                    ("lamp", "лампа"),
                    ("bed", "ліжко"),
                    ("table", "стіл")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "My clothes are in the ___ . (Мій одяг у шафі)", "{}", "wardrobe", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Home",
                    "Home items",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "fridge", ToJsonStringArray("холодильник", "плита", "тарілка"), "холодильник", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("fridge", "холодильник"),
                    ("cooker", "плита"),
                    ("plate", "тарілка"),
                    ("cup", "чашка")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "We cook on the ___ every day. (Ми готуємо на плиті щодня)", "{}", "cooker", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "spoon", ToJsonStringArray("ложка", "виделка", "душ"), "ложка", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("spoon", "ложка"),
                    ("fork", "виделка"),
                    ("shower", "душ"),
                    ("towel", "рушник")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "виделка", "{}", "fork", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "душ", ToJsonStringArray("shower", "fridge", "plate"), "shower", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("fridge", "холодильник"),
                    ("plate", "тарілка"),
                    ("spoon", "ложка"),
                    ("shower", "душ")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I need a clean ___ after the shower. (Мені потрібен чистий рушник після душу)", "{}", "towel", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Home",
                    "Home actions",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "open", ToJsonStringArray("відкривати", "закривати", "прибирати"), "відкривати", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("open", "відкривати"),
                    ("close", "закривати"),
                    ("clean", "прибирати"),
                    ("wash", "мити")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Please ___ the door quietly. (Будь ласка, закрий двері тихо)", "{}", "close", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "cook", ToJsonStringArray("готувати", "відпочивати", "кімната"), "готувати", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("cook", "готувати"),
                    ("rest", "відпочивати"),
                    ("room", "кімната"),
                    ("house", "будинок")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "відпочивати", "{}", "rest", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "кімната", ToJsonStringArray("room", "open", "clean"), "room", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("open", "відкривати"),
                    ("clean", "прибирати"),
                    ("cook", "готувати"),
                    ("room", "кімната")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "My ___ is near the park. (Мій будинок біля парку)", "{}", "house", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Home",
                    "Describing home",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "big", ToJsonStringArray("великий", "малий", "новий"), "великий", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("big", "великий"),
                    ("small", "малий"),
                    ("new", "новий"),
                    ("old", "старий")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "This flat is not big, it is ___ . (Ця квартира не велика, вона мала)", "{}", "small", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "comfortable", ToJsonStringArray("зручний", "тихий", "світлий"), "зручний", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("comfortable", "зручний"),
                    ("quiet", "тихий"),
                    ("bright", "світлий"),
                    ("dark", "темний")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "тихий", "{}", "quiet", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "світлий", ToJsonStringArray("bright", "big", "new"), "bright", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("big", "великий"),
                    ("new", "новий"),
                    ("comfortable", "зручний"),
                    ("bright", "світлий")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The room is ___ without the lamp. (Кімната темна без лампи)", "{}", "dark", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Home",
                    "At home",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "family", ToJsonStringArray("сім'я", "гість", "залишатися"), "сім'я", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("family", "сім'я"),
                    ("guest", "гість"),
                    ("stay", "залишатися"),
                    ("room", "кімната")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "We have a ___ from Spain today. (Сьогодні в нас гість з Іспанії)", "{}", "guest", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "house", ToJsonStringArray("будинок", "ключ", "ліжко"), "будинок", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("house", "будинок"),
                    ("key", "ключ"),
                    ("bed", "ліжко"),
                    ("night", "ніч")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "ключ", "{}", "key", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "ліжко", ToJsonStringArray("bed", "family", "stay"), "bed", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("family", "сім'я"),
                    ("stay", "залишатися"),
                    ("house", "будинок"),
                    ("bed", "ліжко")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "At ___ I usually sleep. (Вночі я зазвичай сплю)", "{}", "night", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Home",
                    "Home review",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "kitchen", ToJsonStringArray("кухня", "ванна кімната", "сад"), "кухня", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("kitchen", "кухня"),
                    ("bathroom", "ванна кімната"),
                    ("garden", "сад"),
                    ("stairs", "сходи")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "The ___ is next to the bedroom. (Ванна кімната поруч зі спальнею)", "{}", "bathroom", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "sofa", ToJsonStringArray("диван", "душ", "прибирати"), "диван", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("sofa", "диван"),
                    ("shower", "душ"),
                    ("clean", "прибирати"),
                    ("comfortable", "зручний")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "душ", "{}", "shower", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "прибирати", ToJsonStringArray("clean", "kitchen", "garden"), "clean", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("kitchen", "кухня"),
                    ("garden", "сад"),
                    ("sofa", "диван"),
                    ("clean", "прибирати")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This sofa is very ___ . (Цей диван дуже зручний)", "{}", "comfortable", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Daily Routine",
                    "Morning routine",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "wake up", ToJsonStringArray("прокидатися", "ранок", "сніданок"), "прокидатися", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("wake up", "прокидатися"),
                    ("morning", "ранок"),
                    ("breakfast", "сніданок"),
                    ("wash face", "мити обличчя")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I like the ___ because it is quiet. (Я люблю ранок, бо він тихий)", "{}", "morning", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "brush teeth", ToJsonStringArray("чистити зуби", "одягатися", "застеляти ліжко"), "чистити зуби", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("brush teeth", "чистити зуби"),
                    ("get dressed", "одягатися"),
                    ("make bed", "застеляти ліжко"),
                    ("school", "школа")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "одягатися", "{}", "get dressed", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "застеляти ліжко", ToJsonStringArray("make bed", "wake up", "breakfast"), "make bed", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("wake up", "прокидатися"),
                    ("breakfast", "сніданок"),
                    ("brush teeth", "чистити зуби"),
                    ("make bed", "застеляти ліжко")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I go to ___ at eight o'clock. (Я йду до школи о восьмій)", "{}", "school", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Daily Routine",
                    "Time words",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "time", ToJsonStringArray("час", "рано", "пізно"), "час", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("time", "час"),
                    ("early", "рано"),
                    ("late", "пізно"),
                    ("today", "сьогодні")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "We get up ___ on Mondays. (У понеділок ми встаємо рано)", "{}", "early", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "tomorrow", ToJsonStringArray("завтра", "завжди", "зазвичай"), "завтра", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("tomorrow", "завтра"),
                    ("always", "завжди"),
                    ("usually", "зазвичай"),
                    ("sometimes", "інколи")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "завжди", "{}", "always", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "зазвичай", ToJsonStringArray("usually", "time", "late"), "usually", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("time", "час"),
                    ("late", "пізно"),
                    ("tomorrow", "завтра"),
                    ("usually", "зазвичай")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I ___ go to the cinema on Friday. (Я інколи ходжу в кіно в п’ятницю)", "{}", "sometimes", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Daily Routine",
                    "School and work day",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "lesson", ToJsonStringArray("урок", "домашнє завдання", "перерва"), "урок", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("lesson", "урок"),
                    ("homework", "домашнє завдання"),
                    ("break", "перерва"),
                    ("study", "вчитися")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I do my ___ after classes. (Я роблю домашнє завдання після занять)", "{}", "homework", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "start", ToJsonStringArray("починати", "закінчувати", "обід"), "починати", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("start", "починати"),
                    ("finish", "закінчувати"),
                    ("lunch", "обід"),
                    ("work", "працювати")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "закінчувати", "{}", "finish", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "обід", ToJsonStringArray("lunch", "lesson", "break"), "lunch", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("lesson", "урок"),
                    ("break", "перерва"),
                    ("start", "починати"),
                    ("lunch", "обід")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "My parents ___ in an office. (Мої батьки працюють в офісі)", "{}", "work", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Daily Routine",
                    "After school",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "play", ToJsonStringArray("грати", "йти", "друг"), "грати", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("play", "грати"),
                    ("walk", "йти"),
                    ("friend", "друг"),
                    ("music", "музика")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "We ___ home after lessons. (Ми йдемо додому після уроків)", "{}", "walk", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "chat", ToJsonStringArray("спілкуватися", "відпочивати", "вправа"), "спілкуватися", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("chat", "спілкуватися"),
                    ("relax", "відпочивати"),
                    ("exercise", "вправа"),
                    ("park", "парк")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "відпочивати", "{}", "relax", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "вправа", ToJsonStringArray("exercise", "play", "friend"), "exercise", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("play", "грати"),
                    ("friend", "друг"),
                    ("chat", "спілкуватися"),
                    ("exercise", "вправа")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The ___ is near my house. (Парк біля мого будинку)", "{}", "park", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Daily Routine",
                    "Evening routine",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "come", ToJsonStringArray("приходити", "вечір", "вечеря"), "приходити", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("come", "приходити"),
                    ("evening", "вечір"),
                    ("dinner", "вечеря"),
                    ("shower", "душ")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "In the ___ I read books. (Увечері я читаю книжки)", "{}", "evening", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "call", ToJsonStringArray("дзвонити", "сім'я", "телевізор"), "дзвонити", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("call", "дзвонити"),
                    ("family", "сім'я"),
                    ("television", "телевізор"),
                    ("night", "ніч")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "сім'я", "{}", "family", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "телевізор", ToJsonStringArray("television", "come", "dinner"), "television", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("come", "приходити"),
                    ("dinner", "вечеря"),
                    ("call", "дзвонити"),
                    ("television", "телевізор")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "At ___ I go to bed. (Вночі я лягаю спати)", "{}", "night", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Daily Routine",
                    "Days of the week",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "Monday", ToJsonStringArray("понеділок", "вівторок", "середа"), "понеділок", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Monday", "понеділок"),
                    ("Tuesday", "вівторок"),
                    ("Wednesday", "середа"),
                    ("Thursday", "четвер")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "The lesson is on ___ . (Урок у вівторок)", "{}", "Tuesday", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "Friday", ToJsonStringArray("п’ятниця", "субота", "неділя"), "п’ятниця", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Friday", "п’ятниця"),
                    ("Saturday", "субота"),
                    ("Sunday", "неділя"),
                    ("weekend", "вихідні")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "субота", "{}", "Saturday", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "неділя", ToJsonStringArray("Sunday", "Monday", "Wednesday"), "Sunday", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("Monday", "понеділок"),
                    ("Wednesday", "середа"),
                    ("Friday", "п’ятниця"),
                    ("Sunday", "неділя")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "On the ___ we do not work. (На вихідні ми не працюємо)", "{}", "weekend", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Daily Routine",
                    "Free time",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "picnic", ToJsonStringArray("пікнік", "кінотеатр", "парк"), "пікнік", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("picnic", "пікнік"),
                    ("cinema", "кінотеатр"),
                    ("park", "парк"),
                    ("bike", "велосипед")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "We go to the ___ on Friday evening. (Ми йдемо в кінотеатр у п’ятницю ввечері)", "{}", "cinema", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "visit", ToJsonStringArray("відвідувати", "друг", "гра"), "відвідувати", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("visit", "відвідувати"),
                    ("friend", "друг"),
                    ("game", "гра"),
                    ("together", "разом")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "друг", "{}", "friend", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "гра", ToJsonStringArray("game", "picnic", "park"), "game", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("picnic", "пікнік"),
                    ("park", "парк"),
                    ("visit", "відвідувати"),
                    ("game", "гра")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "We do homework ___ . (Ми робимо домашнє завдання разом)", "{}", "together", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Daily Routine",
                    "Routine review",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "morning", ToJsonStringArray("ранок", "рано", "домашнє завдання"), "ранок", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("morning", "ранок"),
                    ("early", "рано"),
                    ("homework", "домашнє завдання"),
                    ("study", "вчитися")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I wake up ___ every day. (Я прокидаюся рано щодня)", "{}", "early", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "dinner", ToJsonStringArray("вечеря", "телевізор", "вихідні"), "вечеря", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("dinner", "вечеря"),
                    ("television", "телевізор"),
                    ("weekend", "вихідні"),
                    ("relax", "відпочивати")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "телевізор", "{}", "television", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "вихідні", ToJsonStringArray("weekend", "morning", "homework"), "weekend", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("morning", "ранок"),
                    ("homework", "домашнє завдання"),
                    ("dinner", "вечеря"),
                    ("weekend", "вихідні")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "On Sunday I ___ at home. (У неділю я відпочиваю вдома)", "{}", "relax", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Shopping & Clothes",
                    "In a shop",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "shop", ToJsonStringArray("магазин", "крамниця", "купувати"), "магазин", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("shop", "магазин"),
                    ("store", "крамниця"),
                    ("buy", "купувати"),
                    ("sell", "продавати")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "This ___ is open until nine. (Ця крамниця відкрита до дев’ятої)", "{}", "store", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "price", ToJsonStringArray("ціна", "готівка", "картка"), "ціна", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("price", "ціна"),
                    ("cash", "готівка"),
                    ("card", "картка"),
                    ("bill", "рахунок")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "готівка", "{}", "cash", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "картка", ToJsonStringArray("card", "shop", "buy"), "card", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("shop", "магазин"),
                    ("buy", "купувати"),
                    ("price", "ціна"),
                    ("card", "картка")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Can I have the ___ , please? (Можна рахунок, будь ласка?)", "{}", "bill", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Shopping & Clothes",
                    "Clothes basics",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "T-shirt", ToJsonStringArray("футболка", "сорочка", "джинси"), "футболка", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("T-shirt", "футболка"),
                    ("shirt", "сорочка"),
                    ("jeans", "джинси"),
                    ("trousers", "штани")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I wear a white ___ to school. (Я ношу білу сорочку до школи)", "{}", "shirt", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "dress", ToJsonStringArray("сукня", "спідниця", "куртка"), "сукня", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("dress", "сукня"),
                    ("skirt", "спідниця"),
                    ("jacket", "куртка"),
                    ("coat", "пальто")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "спідниця", "{}", "skirt", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "куртка", ToJsonStringArray("jacket", "T-shirt", "jeans"), "jacket", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("T-shirt", "футболка"),
                    ("jeans", "джинси"),
                    ("dress", "сукня"),
                    ("jacket", "куртка")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "My ___ is very warm in winter. (Моє пальто дуже тепле взимку)", "{}", "coat", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Shopping & Clothes",
                    "Shoes and accessories",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "shoes", ToJsonStringArray("взуття", "черевики", "шапка"), "взуття", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("shoes", "взуття"),
                    ("boots", "черевики"),
                    ("hat", "шапка"),
                    ("cap", "кепка")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "These ___ are new. (Ці черевики нові)", "{}", "boots", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "scarf", ToJsonStringArray("шарф", "сумка", "парасоля"), "шарф", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("scarf", "шарф"),
                    ("bag", "сумка"),
                    ("umbrella", "парасоля"),
                    ("new", "новий")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "сумка", "{}", "bag", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "парасоля", ToJsonStringArray("umbrella", "shoes", "hat"), "umbrella", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("shoes", "взуття"),
                    ("hat", "шапка"),
                    ("scarf", "шарф"),
                    ("umbrella", "парасоля")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This hat is not old, it is ___ . (Ця шапка не стара, вона нова)", "{}", "new", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Shopping & Clothes",
                    "Colors and style",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "red", ToJsonStringArray("червоний", "чорний", "білий"), "червоний", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("red", "червоний"),
                    ("black", "чорний"),
                    ("white", "білий"),
                    ("brown", "коричневий")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "The night sky is ___ . (Нічне небо чорне)", "{}", "black", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "pink", ToJsonStringArray("рожевий", "сірий", "великий"), "рожевий", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("pink", "рожевий"),
                    ("grey", "сірий"),
                    ("big", "великий"),
                    ("small", "малий")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "сірий", "{}", "grey", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "великий", ToJsonStringArray("big", "red", "white"), "big", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("red", "червоний"),
                    ("white", "білий"),
                    ("pink", "рожевий"),
                    ("big", "великий")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This T-shirt is too ___ for me. (Ця футболка для мене замала)", "{}", "small", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Shopping & Clothes",
                    "Trying on clothes",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "size", ToJsonStringArray("розмір", "підходити за розміром", "занадто великий"), "розмір", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("size", "розмір"),
                    ("fit", "підходити за розміром"),
                    ("too big", "занадто великий"),
                    ("too small", "занадто малий")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "These shoes ___ me well. (Ці черевики мені підходять за розміром)", "{}", "fit", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "medium", ToJsonStringArray("середній", "приміряти", "одягати"), "середній", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("medium", "середній"),
                    ("try on", "приміряти"),
                    ("put on", "одягати"),
                    ("take off", "знімати")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "приміряти", "{}", "try on", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "одягати", ToJsonStringArray("put on", "size", "too big"), "put on", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("size", "розмір"),
                    ("too big", "занадто великий"),
                    ("medium", "середній"),
                    ("put on", "одягати")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Please ___ your coat here. (Будь ласка, зніміть пальто тут)", "{}", "take off", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Shopping & Clothes",
                    "Payments and offers",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "receipt", ToJsonStringArray("чек", "знижка", "розпродаж"), "чек", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("receipt", "чек"),
                    ("discount", "знижка"),
                    ("sale", "розпродаж"),
                    ("wallet", "гаманець")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "There is a big ___ today. (Сьогодні велика знижка)", "{}", "discount", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "coin", ToJsonStringArray("монета", "ціна", "дешевий"), "монета", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("coin", "монета"),
                    ("price", "ціна"),
                    ("cheap", "дешевий"),
                    ("expensive", "дорогий")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "ціна", "{}", "price", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "дешевий", ToJsonStringArray("cheap", "receipt", "sale"), "cheap", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("receipt", "чек"),
                    ("sale", "розпродаж"),
                    ("coin", "монета"),
                    ("cheap", "дешевий")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This bag is too ___ for me. (Ця сумка для мене занадто дорога)", "{}", "expensive", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Shopping & Clothes",
                    "At the supermarket",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "basket", ToJsonStringArray("кошик", "полиця", "пляшка"), "кошик", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("basket", "кошик"),
                    ("shelf", "полиця"),
                    ("bottle", "пляшка"),
                    ("packet", "пакет")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "The milk is on the top ___ . (Молоко на верхній полиці)", "{}", "shelf", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "kilo", ToJsonStringArray("кілограм", "шматок", "список"), "кілограм", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("kilo", "кілограм"),
                    ("piece", "шматок"),
                    ("list", "список"),
                    ("market", "ринок")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "шматок", "{}", "piece", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "список", ToJsonStringArray("list", "basket", "bottle"), "list", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("basket", "кошик"),
                    ("bottle", "пляшка"),
                    ("kilo", "кілограм"),
                    ("list", "список")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "We buy fruit at the ___ . (Ми купуємо фрукти на ринку)", "{}", "market", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Shopping & Clothes",
                    "Shopping review",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "shop", ToJsonStringArray("магазин", "джинси", "взуття"), "магазин", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("shop", "магазин"),
                    ("jeans", "джинси"),
                    ("shoes", "взуття"),
                    ("umbrella", "парасоля")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I wear ___ on Friday. (Я ношу джинси у п’ятницю)", "{}", "jeans", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "fit", ToJsonStringArray("підходити за розміром", "розпродаж", "кошик"), "підходити за розміром", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("fit", "підходити за розміром"),
                    ("sale", "розпродаж"),
                    ("basket", "кошик"),
                    ("market", "ринок")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "розпродаж", "{}", "sale", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "кошик", ToJsonStringArray("basket", "shop", "shoes"), "basket", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("shop", "магазин"),
                    ("shoes", "взуття"),
                    ("fit", "підходити за розміром"),
                    ("basket", "кошик")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The ___ is open in the morning. (Ринок відкритий зранку)", "{}", "market", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Weather & Seasons",
                    "Seasons",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "spring", ToJsonStringArray("весна", "літо", "осінь"), "весна", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("spring", "весна"),
                    ("summer", "літо"),
                    ("autumn", "осінь"),
                    ("winter", "зима")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I love ___ because school ends. (Я люблю літо, бо школа закінчується)", "{}", "summer", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "weather", ToJsonStringArray("погода", "пора року", "гарячий"), "погода", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("weather", "погода"),
                    ("season", "пора року"),
                    ("hot", "гарячий"),
                    ("cold", "холодний")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "пора року", "{}", "season", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "гарячий", ToJsonStringArray("hot", "spring", "autumn"), "hot", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("spring", "весна"),
                    ("autumn", "осінь"),
                    ("weather", "погода"),
                    ("hot", "гарячий")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The wind is very ___ today. (Сьогодні вітер холодний)", "{}", "cold", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Weather & Seasons",
                    "Sunny days",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "sun", ToJsonStringArray("сонце", "сонячний", "небо"), "сонце", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("sun", "сонце"),
                    ("sunny", "сонячний"),
                    ("sky", "небо"),
                    ("cloud", "хмара")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "It is ___ and warm today. (Сьогодні сонячно і тепло)", "{}", "sunny", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "cloudy", ToJsonStringArray("хмарний", "теплий", "синій"), "хмарний", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("cloudy", "хмарний"),
                    ("warm", "теплий"),
                    ("blue", "синій"),
                    ("today", "сьогодні")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "теплий", "{}", "warm", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "синій", ToJsonStringArray("blue", "sun", "sky"), "blue", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("sun", "сонце"),
                    ("sky", "небо"),
                    ("cloudy", "хмарний"),
                    ("blue", "синій")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The sun is bright ___ . (Сонце яскраве сьогодні)", "{}", "today", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Weather & Seasons",
                    "Rain and wind",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "rain", ToJsonStringArray("дощ", "дощовий", "парасоля"), "дощ", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("rain", "дощ"),
                    ("rainy", "дощовий"),
                    ("umbrella", "парасоля"),
                    ("wind", "вітер")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "It is ___ , so take an umbrella. (Дощово, тому візьми парасольку)", "{}", "rainy", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "windy", ToJsonStringArray("вітряний", "мокрий", "куртка"), "вітряний", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("windy", "вітряний"),
                    ("wet", "мокрий"),
                    ("jacket", "куртка"),
                    ("storm", "буря")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "мокрий", "{}", "wet", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "куртка", ToJsonStringArray("jacket", "rain", "umbrella"), "jacket", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("rain", "дощ"),
                    ("umbrella", "парасоля"),
                    ("windy", "вітряний"),
                    ("jacket", "куртка")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The ___ is very strong tonight. (Буря сьогодні дуже сильна)", "{}", "storm", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Weather & Seasons",
                    "Cold weather",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "snow", ToJsonStringArray("сніг", "сніжний", "лід"), "сніг", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("snow", "сніг"),
                    ("snowy", "сніжний"),
                    ("ice", "лід"),
                    ("boots", "черевики")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "The street is white and ___ . (Вулиця біла і сніжна)", "{}", "snowy", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "scarf", ToJsonStringArray("шарф", "рукавички", "мерзнути"), "шарф", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("scarf", "шарф"),
                    ("gloves", "рукавички"),
                    ("freeze", "мерзнути"),
                    ("weather", "погода")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "рукавички", "{}", "gloves", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "мерзнути", ToJsonStringArray("freeze", "snow", "ice"), "freeze", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("snow", "сніг"),
                    ("ice", "лід"),
                    ("scarf", "шарф"),
                    ("freeze", "мерзнути")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The ___ is bad today. (Погода сьогодні погана)", "{}", "weather", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Weather & Seasons",
                    "Temperature",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "temperature", ToJsonStringArray("температура", "градус", "мінус"), "температура", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("temperature", "температура"),
                    ("degree", "градус"),
                    ("minus", "мінус"),
                    ("plus", "плюс")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Today it is one ___ above zero. (Сьогодні один градус вище нуля)", "{}", "degree", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "weather forecast", ToJsonStringArray("прогноз погоди", "сьогодні", "завтра"), "прогноз погоди", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("weather forecast", "прогноз погоди"),
                    ("today", "сьогодні"),
                    ("tomorrow", "завтра"),
                    ("cold", "холодний")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "сьогодні", "{}", "today", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "завтра", ToJsonStringArray("tomorrow", "temperature", "minus"), "tomorrow", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("temperature", "температура"),
                    ("minus", "мінус"),
                    ("weather forecast", "прогноз погоди"),
                    ("tomorrow", "завтра")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The water is very ___ in winter. (Вода взимку дуже холодна)", "{}", "cold", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Weather & Seasons",
                    "Nature and plans",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "beach", ToJsonStringArray("пляж", "ліс", "гора"), "пляж", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("beach", "пляж"),
                    ("forest", "ліс"),
                    ("mountain", "гора"),
                    ("river", "річка")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "We walk in the ___ on Sunday. (Ми гуляємо в лісі в неділю)", "{}", "forest", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "tree", ToJsonStringArray("дерево", "квітка", "трава"), "дерево", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("tree", "дерево"),
                    ("flower", "квітка"),
                    ("grass", "трава"),
                    ("park", "парк")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "квітка", "{}", "flower", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "трава", ToJsonStringArray("grass", "beach", "mountain"), "grass", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("beach", "пляж"),
                    ("mountain", "гора"),
                    ("tree", "дерево"),
                    ("grass", "трава")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "The children play in the ___ . (Діти граються в парку)", "{}", "park", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Weather & Seasons",
                    "What to wear",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "coat", ToJsonStringArray("пальто", "светр", "футболка"), "пальто", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("coat", "пальто"),
                    ("sweater", "светр"),
                    ("T-shirt", "футболка"),
                    ("shorts", "шорти")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I wear a ___ when it is cold. (Я ношу светр, коли холодно)", "{}", "sweater", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "sunglasses", ToJsonStringArray("сонцезахисні окуляри", "дощовик", "кепка"), "сонцезахисні окуляри", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("sunglasses", "сонцезахисні окуляри"),
                    ("raincoat", "дощовик"),
                    ("cap", "кепка"),
                    ("shoes", "взуття")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "дощовик", "{}", "raincoat", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "кепка", ToJsonStringArray("cap", "coat", "T-shirt"), "cap", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("coat", "пальто"),
                    ("T-shirt", "футболка"),
                    ("sunglasses", "сонцезахисні окуляри"),
                    ("cap", "кепка")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "My ___ are near the door. (Моє взуття біля дверей)", "{}", "shoes", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Weather & Seasons",
                    "Weather review",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "spring", ToJsonStringArray("весна", "сонячний", "дощовий"), "весна", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("spring", "весна"),
                    ("sunny", "сонячний"),
                    ("rainy", "дощовий"),
                    ("snow", "сніг")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Tomorrow will be ___ and warm. (Завтра буде сонячно і тепло)", "{}", "sunny", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "temperature", ToJsonStringArray("температура", "пляж", "светр"), "температура", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("temperature", "температура"),
                    ("beach", "пляж"),
                    ("sweater", "светр"),
                    ("weather forecast", "прогноз погоди")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "пляж", "{}", "beach", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "светр", ToJsonStringArray("sweater", "spring", "rainy"), "sweater", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("spring", "весна"),
                    ("rainy", "дощовий"),
                    ("temperature", "температура"),
                    ("sweater", "светр")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I check the ___ every morning. (Я перевіряю прогноз погоди щоранку)", "{}", "weather forecast", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Health & Body",
                    "Body parts 1",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "head", ToJsonStringArray("голова", "обличчя", "око"), "голова", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("head", "голова"),
                    ("face", "обличчя"),
                    ("eye", "око"),
                    ("ear", "вухо")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "My ___ is clean. (Моє обличчя чисте)", "{}", "face", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "nose", ToJsonStringArray("ніс", "рот", "рука"), "ніс", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("nose", "ніс"),
                    ("mouth", "рот"),
                    ("hand", "рука"),
                    ("leg", "нога")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "рот", "{}", "mouth", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "рука", ToJsonStringArray("hand", "head", "eye"), "hand", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("head", "голова"),
                    ("eye", "око"),
                    ("nose", "ніс"),
                    ("hand", "рука")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "My ___ hurts after football. (Моя нога болить після футболу)", "{}", "leg", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Health & Body",
                    "Body parts 2",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "arm", ToJsonStringArray("рука", "ступня", "зуб"), "рука", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("arm", "рука"),
                    ("foot", "ступня"),
                    ("tooth", "зуб"),
                    ("back", "спина")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "My ___ hurts after the walk. (Моя ступня болить після прогулянки)", "{}", "foot", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "stomach", ToJsonStringArray("живіт", "волосся", "шия"), "живіт", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("stomach", "живіт"),
                    ("hair", "волосся"),
                    ("neck", "шия"),
                    ("shoulder", "плече")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "волосся", "{}", "hair", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "шия", ToJsonStringArray("neck", "arm", "tooth"), "neck", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("arm", "рука"),
                    ("tooth", "зуб"),
                    ("stomach", "живіт"),
                    ("neck", "шия")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "My bag is on my ___ . (Моя сумка на моєму плечі)", "{}", "shoulder", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Health & Body",
                    "At the doctor",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "doctor", ToJsonStringArray("лікар", "медсестра", "лікарня"), "лікар", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("doctor", "лікар"),
                    ("nurse", "медсестра"),
                    ("hospital", "лікарня"),
                    ("medicine", "ліки")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "The ___ helps the doctor. (Медсестра допомагає лікарю)", "{}", "nurse", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "appointment", ToJsonStringArray("прийом", "допомога", "здоровий"), "прийом", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("appointment", "прийом"),
                    ("help", "допомога"),
                    ("healthy", "здоровий"),
                    ("sick", "хворий")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "допомога", "{}", "help", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "здоровий", ToJsonStringArray("healthy", "doctor", "hospital"), "healthy", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("doctor", "лікар"),
                    ("hospital", "лікарня"),
                    ("appointment", "прийом"),
                    ("healthy", "здоровий")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "He is ___ and stays at home. (Він хворий і залишається вдома)", "{}", "sick", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Health & Body",
                    "Common problems",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "headache", ToJsonStringArray("головний біль", "зубний біль", "кашель"), "головний біль", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("headache", "головний біль"),
                    ("toothache", "зубний біль"),
                    ("cough", "кашель"),
                    ("cold", "застуда")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I have a ___ after ice cream. (У мене зубний біль після морозива)", "{}", "toothache", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "fever", ToJsonStringArray("температура", "біль у горлі", "нежить"), "температура", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("fever", "температура"),
                    ("sore throat", "біль у горлі"),
                    ("runny nose", "нежить"),
                    ("tired", "втомлений")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "біль у горлі", "{}", "sore throat", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "нежить", ToJsonStringArray("runny nose", "headache", "cough"), "runny nose", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("headache", "головний біль"),
                    ("cough", "кашель"),
                    ("fever", "температура"),
                    ("runny nose", "нежить")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "I am very ___ after work. (Я дуже втомлений після роботи)", "{}", "tired", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Health & Body",
                    "Healthy habits",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "water", ToJsonStringArray("вода", "сніданок", "фрукт"), "вода", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("water", "вода"),
                    ("breakfast", "сніданок"),
                    ("fruit", "фрукт"),
                    ("walk", "йти")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I eat ___ every morning. (Я їм сніданок щоранку)", "{}", "breakfast", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "sleep", ToJsonStringArray("спати", "вправа", "відпочивати"), "спати", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("sleep", "спати"),
                    ("exercise", "вправа"),
                    ("rest", "відпочивати"),
                    ("healthy", "здоровий")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "вправа", "{}", "exercise", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "відпочивати", ToJsonStringArray("rest", "water", "fruit"), "rest", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("water", "вода"),
                    ("fruit", "фрукт"),
                    ("sleep", "спати"),
                    ("rest", "відпочивати")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Fruit and water keep you ___ . (Фрукти і вода роблять тебе здоровим)", "{}", "healthy", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Health & Body",
                    "Feeling better",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "stay in bed", ToJsonStringArray("залишатися в ліжку", "приймати ліки", "пити чай"), "залишатися в ліжку", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("stay in bed", "залишатися в ліжку"),
                    ("take medicine", "приймати ліки"),
                    ("drink tea", "пити чай"),
                    ("call a doctor", "викликати лікаря")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "I need to ___ today. (Мені треба приймати ліки сьогодні)", "{}", "take medicine", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "check", ToJsonStringArray("перевіряти", "краще", "гірше"), "перевіряти", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("check", "перевіряти"),
                    ("better", "краще"),
                    ("worse", "гірше"),
                    ("problem", "проблема")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "краще", "{}", "better", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "гірше", ToJsonStringArray("worse", "stay in bed", "drink tea"), "worse", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("stay in bed", "залишатися в ліжку"),
                    ("drink tea", "пити чай"),
                    ("check", "перевіряти"),
                    ("worse", "гірше")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This ___ is serious. (Ця проблема серйозна)", "{}", "problem", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Health & Body",
                    "Emergencies and advice",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "ambulance", ToJsonStringArray("швидка допомога", "обережний", "небезпечний"), "швидка допомога", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("ambulance", "швидка допомога"),
                    ("careful", "обережний"),
                    ("dangerous", "небезпечний"),
                    ("bandage", "бинт")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Be ___ on the road. (Будь обережний на дорозі)", "{}", "careful", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "hurt", ToJsonStringArray("боліти", "нещасний випадок", "телефон"), "боліти", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("hurt", "боліти"),
                    ("accident", "нещасний випадок"),
                    ("phone", "телефон"),
                    ("emergency", "надзвичайна ситуація")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "нещасний випадок", "{}", "accident", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "телефон", ToJsonStringArray("phone", "ambulance", "dangerous"), "phone", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("ambulance", "швидка допомога"),
                    ("dangerous", "небезпечний"),
                    ("hurt", "боліти"),
                    ("phone", "телефон")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "Call 112 in an ___ . (Подзвони 112 у надзвичайній ситуації)", "{}", "emergency", 9)
                    }
                ),
                new LessonExerciseSeed
                (
                    "Health & Body",
                    "Health review",
                    new List<ExerciseSeed>
                    {
                new ExerciseSeed(ExerciseType.MultipleChoice, "doctor", ToJsonStringArray("лікар", "ліки", "головний біль"), "лікар", 1),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("doctor", "лікар"),
                    ("medicine", "ліки"),
                    ("headache", "головний біль"),
                    ("healthy", "здоровий")
                ), "{}", 2),
                new ExerciseSeed(ExerciseType.Input, "Take your ___ after dinner. (Прийми ліки після вечері)", "{}", "medicine", 3),
                new ExerciseSeed(ExerciseType.MultipleChoice, "fruit", ToJsonStringArray("фрукт", "відпочивати", "обережний"), "фрукт", 4),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("fruit", "фрукт"),
                    ("rest", "відпочивати"),
                    ("careful", "обережний"),
                    ("emergency", "надзвичайна ситуація")
                ), "{}", 5),
                new ExerciseSeed(ExerciseType.Input, "відпочивати", "{}", "rest", 6),
                new ExerciseSeed(ExerciseType.MultipleChoice, "обережний", ToJsonStringArray("careful", "doctor", "headache"), "careful", 7),
                new ExerciseSeed(ExerciseType.Match, "Match the words", ToJsonMatchPairs(
                    ("doctor", "лікар"),
                    ("headache", "головний біль"),
                    ("fruit", "фрукт"),
                    ("careful", "обережний")
                ), "{}", 8),
                new ExerciseSeed(ExerciseType.Input, "This is an ___ . Call the doctor now. (Це надзвичайна ситуація. Подзвони лікарю зараз)", "{}", "emergency", 9)
                    }
                )
            };
        }

        private static string ToJsonStringArray(params string[] items)
        {
            return JsonSerializer.Serialize(items.ToList());
        }

        private static string ToJsonMatchPairs(params (string Left, string Right)[] pairs)
        {
            var data = pairs
                .Select(x => new MatchPairSeed { left = x.Left, right = x.Right })
                .ToList();

            return JsonSerializer.Serialize(data);
        }

        private class MatchPairSeed
        {
            public string left { get; set; } = null!;
            public string right { get; set; } = null!;
        }
    }

    public record CourseSeed(string Title, string Description, string LanguageCode, bool IsPublished, string? Level, int Order);

    public record SceneStepSeed(
        int Order,
        string Speaker,
        string Text,
        string StepType,
        string? MediaUrl = null,
        string? ChoicesJson = null);

    public record TopicSeed(string Title, int Order);

    public record LessonSeed(int TopicId, string Title, string Theory, int Order);

    public record ExerciseSeed(ExerciseType Type, string Question, string Data, string CorrectAnswer, int Order, string? ImageUrl = null);

    public record LessonExerciseSeed(string TopicTitle, string LessonTitle, List<ExerciseSeed> Exercises);
}
