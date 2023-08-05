package app;

import com.iconloop.score.test.Account;
import com.iconloop.score.test.ServiceManager;
import com.iconloop.score.test.TestBase;
import com.iconloop.score.test.Score;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;

public class HelloWorldTest extends TestBase {
    private static final ServiceManager sm = getServiceManager();
    private static final Account owner = sm.createAccount();
    private static final String btpAddress = "btp://0xaa36a7.eth2/0x817c542D606ba65b9B158919A77A2Df5AeE2E2EF";
    private static Score DappScore;

    @BeforeAll
    public static void setup() throws Exception {
        DappScore = sm.deploy(owner, HelloWorld.class);
        DappScore.invoke(owner, "initialize", owner.getAddress(), btpAddress);
    }

    @Test
    public void invokeSendMessage() {
        byte [] payload = "Hello World".getBytes();
        byte [] rollback = "rollback".getBytes();
        DappScore.invoke(owner, "sendMessage", payload, rollback);
    }
}
