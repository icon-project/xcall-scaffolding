package app;


import com.iconloop.score.test.Account;
import com.iconloop.score.test.ServiceManager;
import com.iconloop.score.test.TestBase;
import com.iconloop.score.test.Score;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class VotingDappTest extends TestBase {
    private static final ServiceManager sm = getServiceManager();
    private static final Account owner = sm.createAccount();
    private static final String destinationAddress = "0xaa36a7.eth2/0x817c542D606ba65b9B158919A77A2Df5AeE2E2EF";
    private static Score DappScore;

    @BeforeAll
    public static void setup() throws Exception {
        DappScore = sm.deploy(owner, VotingDapp.class);
        DappScore.invoke(owner, "initialize", owner.getAddress(), destinationAddress);
    }

    @Test
    public void hasGetXCallContractAddress() {
        Object response = DappScore.call("getXCallContractAddress");
        System.out.println("xcall: " + response);
        assertEquals(response, owner.getAddress());
    }

    @Test
    public void hasGetDestinationAddress() {
        Object response = DappScore.call("getDestinationAddress");
        System.out.println("destination address: " + response );
        assertEquals(response, destinationAddress);
    }

    @Test
    public void invokeVoteYes() {
        DappScore.invoke(owner, "voteYes");
    }

    @Test
    public void invokeVoteNo() {
        DappScore.invoke(owner, "voteNo");
    }

    @Test
    public void callGetVotes() {
        Object response = DappScore.call("getVotes");
        System.out.println("votes: " + response );
    }
}
